import { test, expect } from "@playwright/test";

import { createStore } from "../../src/utils/state-management/createStore.js";
import { batchEffects } from "../../src/utils/state-management/batchEffects.js";
import { derive } from "../../src/utils/state-management/derive.js";

test.describe("Базовая логика", () => {
  test("Простейшая подписка", () => {
    let a = { value: 0 };
    a = createStore(a);

    let b;
    derive(() => {
      b = a.value + 1;
    });

    expect(b).toBe(1);

    a.value += 1;
    expect(b).toBe(2);

    a.value += 1;
    expect(b).toBe(3);
    expect(a.value).toBe(2);
  });

  test("Несколько обращений к свойству в одном сторе (обработчик добавляется только один раз)", () => {
    const store = createStore({ value: 0 });
    let a;
    let b;

    let calls = 0;
    derive(() => {
      a = store.value;
      b = store.value + 1;
      calls++;
    });

    store.value = 1;
    expect(a).toBe(1);
    expect(b).toBe(2);
    expect(calls).toBe(2);
  });

  test("Циклическая зависимость", () => {
    const a = createStore({ value: 0, store: "a" });
    const b = createStore({ value: 0, store: "b" });

    derive(() => {
      a.value = -b.value;
    });
    derive(() => {
      b.value = -a.value;
    });

    b.value = 2;
    expect(a.value).toBe(-2);

    a.value = 1;
    expect(b.value).toBe(-1);
  });

  test("Зависимость свойства в одном сторе от другого", () => {
    const a = createStore({ prop: 1, derivedProp: 2 });

    derive(() => {
      a.derivedProp = a.prop + 1;
    });

    a.prop = 2;
    expect(a.derivedProp).toBe(3);
  });

  test("Сложная цепочка вычисления зависимых свойств в одном сторе", () => {
    const store = createStore({ a: 1, b: 2, c: 4 });

    derive(() => {
      store.a = store.b - 1;
    });

    derive(() => {
      store.b = store.a + 1;
    });

    derive(() => {
      store.c = store.b * 2;
    });

    derive(() => {
      store.b = store.c / 2;
    });

    store.a = 2;
    expect(store.b).toBe(3);
    expect(store.c).toBe(6);

    store.b = 4;
    expect(store.a).toBe(3);
    expect(store.c).toBe(8);

    store.c = 12;
    expect(store.b).toBe(6);
    expect(store.a).toBe(5);
  });

  test("Цепочка вычислений зависимостей в разных сторах", () => {
    const storeA = createStore({ a: 1, b: 2, c: 3 });
    const storeB = createStore({ d: 1, e: 2 });

    derive(() => {
      storeB.d = storeA.a + 1;
    });
    derive(() => {
      storeA.c = storeB.d * 5;
    });

    expect(storeB.d).toBe(2);
    expect(storeA.c).toBe(10);

    storeA.a = 10;
    expect(storeB.d).toBe(11);
    expect(storeA.c).toBe(55);
  });

  test("Отключение наблюдения", () => {
    const storeA = createStore({ value: 1 });

    let b;
    const cleanup = derive(() => {
      b = storeA.value * 2;
    });

    storeA.value = 2;
    expect(b).toBe(4);

    storeA.value = 3;
    expect(b).toBe(6);

    cleanup();
    storeA.value = 1;
    expect(b).toBe(6);
  });

  test("Отключение наблюдения у несколькоих объектов (в derive несколько свойств)", () => {
    const storeA = createStore({ a: 1 });
    const storeB = createStore({ b: 1 });

    let calls = 0;

    let result;
    const cleanup = derive(() => {
      result = storeA.a + storeB.b;
      calls++;
    });

    storeA.a = 2;
    expect(result).toBe(3);
    expect(calls).toBe(2);

    storeB.b = 3;
    expect(result).toBe(5);
    expect(calls).toBe(3);

    cleanup();

    storeA.a = 1;
    storeB.b = 2;
    expect(result).toBe(5);
    expect(calls).toBe(3);
  });
});

test.describe("Обработка ошибок", () => {
  const originalFunc = console.error;

  test.beforeAll(() => {
    console.error = () => {};
  });

  test.afterAll(() => {
    console.error = originalFunc;
  });

  test("Если произошла ошибка в одной из derive-функций, система откатывается к последнему стабильному состоянию", () => {
    const storeA = createStore({ value: 0 });

    let b;
    let c;

    const fn = value => {
      if (value % 2) throw new Error();

      return value;
    };

    derive(() => {
      b = fn(storeA.value) + 1;
      c = fn(storeA.value) + 2;
    });

    test.step("Удачная установка свойства", () => {
      storeA.value = 10;
      expect(b).toBe(11);
      expect(c).toBe(12);
    });

    test.step("Неудачная установка. Вычисляемые при изменениях значения остались нетронутыми", () => {
      storeA.value = 11;
      expect(storeA.value).toBe(10);
      expect(b).toBe(11);
      expect(c).toBe(12);
    });
  });

  test("При сложной цепочке результат промежуточных значений так же игнорируется", () => {
    const storeA = createStore({ a: 0 });
    const storeB = createStore({ b: 0 });

    let b;
    let c;
    let d;

    derive(() => {
      b = storeA.a + 1;
      storeB.b = storeA.a * 2;
    });

    derive(() => {
      c = storeB.b + 1;
    });

    derive(() => {
      d = storeB.b;
      if (b === 11) throw new Error("Ошибка установки переменной 'd'");
    });

    storeA.a = 2;
    expect(b).toBe(3);
    expect(storeB.b).toBe(4);
    expect(c).toBe(5);
    expect(d).toBe(4);

    storeA.a = 10;
    expect(b).toBe(3);
    expect(storeB.b).toBe(4);
    expect(c).toBe(5);
    expect(d).toBe(4);
    expect(storeA.a).toBe(2);
  });
});

test.describe("Асинхронщина", () => {
  const pause = ms => new Promise(res => setTimeout(res), ms);

  test("Запуск асинхронных функций возможен в принципе", async () => {
    const storeA = createStore({ a: 1 });

    let b;
    derive(async () => {
      const origin = storeA.a;

      const fn = async () => {
        await pause(10);

        if (storeA.a !== origin) return;
        b = origin;
      };

      fn();
    });

    expect(() => expect(b).toBe(2)).toPass();
  });

  test("Батчинг", async () => {
    const storeA = createStore({ a: 1 });
    const storeB = createStore({ b: 1 });

    const callResults = [];
    const cleanup = batchEffects(() => {
      const storeValuesPair = [storeA.a, storeB.b];
      callResults.push(storeValuesPair);
    });

    storeA.a = 10;
    storeB.b = 10;

    storeA.a = 5;
    storeB.b = 5;

    storeA.a = 0;
    storeB.b = 1;

    expect(callResults.length).toBe(1);
    await expect(() => {
      expect(callResults.length).toBe(2);
      const lastCallResult = callResults.at(-1);
      const [a, b] = lastCallResult;

      expect(a === 0 && b === 1).toBe(true);
    }).toPass();

    await test.step("Очистка эффекта", async () => {
      cleanup();
      storeA.a = 10;

      await pause(100);
      const lastCallResult = callResults.at(-1);
      const [a, b] = lastCallResult;

      expect(callResults.length).toBe(2);
      expect(a === 0 && b === 1).toBe(true);
    });
  });
});

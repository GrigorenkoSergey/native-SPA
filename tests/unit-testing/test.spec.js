import { test, expect } from "@playwright/test";

import { makeObservable } from "../../src/utils/state-management/makeObservable";
import { derive } from "../../src/utils/state-management/derive";

test("Простейшая подписка", () => {
  let a = { value: 0 };
  a = makeObservable(a);

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

test("Циклическая зависимость", () => {
  const a = makeObservable({ value: 0, store: "a" });
  const b = makeObservable({ value: 0, store: "b" });

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
  const a = makeObservable({ prop: 1, derivedProp: 2 });

  derive(() => {
    a.derivedProp = a.prop + 1;
  });

  a.prop = 2;
  expect(a.derivedProp).toBe(3);
});

test("Сложная цепочка вычисления зависимых свойств в одном сторе", () => {
  const store = makeObservable({ a: 1, b: 2, c: 4 });

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

test.skip("Тест на асинхнорщину", () => {});

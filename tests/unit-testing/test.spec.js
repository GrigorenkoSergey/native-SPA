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
  const a = makeObservable({ value: 0 });
  const b = makeObservable({ value: 0 });

  derive(() => {
    a.value = -b.value;
  });

  b.value = 2;
  expect(a.value).toBe(-2);

  derive(() => {
    b.value = -a.value;
  });

  a.value = 1;
  expect(b.value).toBe(-1);
});

test.skip("Тест на асинхнорщину", () => {});

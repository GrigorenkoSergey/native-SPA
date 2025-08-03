import { test, expect } from "@playwright/test";

import { makeObservable } from "../../src/utils/state-management/makeObservable";
import { derive } from "../../src/utils/state-management/derive";

test.only("Простейшая подписка", () => {
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

test.skip("Циклическая зависимость", () => {
  const a = makeObservable({ value: 0 });
  const b = makeObservable({ value: 0 });

  const getValueFromOther = value => -value;

  derive(() => {
    a.value = getValueFromOther(b.value);
    b.value = getValueFromOther(a.value);
  });

  a.value = 1;
  expect(b.value).toBe(getValueFromOther(a.value));

  b.value = 2;
  expect(a.value).toBe(getValueFromOther(b.value));
});

test.skip("Тест на асинхнорщину", () => {});

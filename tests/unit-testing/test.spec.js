import { test, expect } from "@playwright/test";

const sum = (a, b) => a + b;
test("Sum", () => {
  expect(sum(2, 2)).toEqual(4);
});

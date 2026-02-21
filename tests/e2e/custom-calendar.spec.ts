import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 1, 14));
  await page.goto("http://localhost:8082/pages/custom-calendar/");
});

test("Отображение и переключение месяцев", async ({page}) => {
  const calendar = page.getByTestId("basic");
  const firstTd = calendar.locator("td").first();
  const lastTd = calendar.locator("td").last();

  await expect(page.getByRole("heading", { name: "февраль" })).toContainText("февраль 2026");
  await expect(firstTd).toContainText("26");
  await expect(lastTd).toContainText("1");

  await test.step("Предыдущий месяц", async () => {
    await page.getByRole("button", { name: "prev month" }).click();
    await expect(page.getByRole("heading", { name: "январь" })).toContainText("январь 2026");
    await expect(firstTd).toContainText("29");
    await expect(lastTd).toContainText("1");
  });

  await test.step("Следующий месяц", async () => {
    await page.getByRole("button", { name: "next month" }).click();
    await expect(page.getByRole("heading", { name: "февраль" })).toContainText("февраль 2026");
    await expect(firstTd).toContainText("26");
    await expect(lastTd).toContainText("1");
  });
});

test("Выделение даты, даты предыдущего и следующего месяца нельзя выбрать", async ({page}) => {
  const calendar = page.getByTestId("basic");
  const selectedClassName = "selected";

  await test.step("По умолчанию выбрана текущая дата (если нет соответствующего атрибута)", async () => {
    const selected = calendar.locator(".selected");
    await expect(selected).toContainText("14");
  });

  await test.step("Даты предыдущего и следующего месяца нельзы выбрать в текущем календарике", async () => {
    const firstTd = calendar.locator("td").first();
    const lastTd = calendar.locator("td").last();

    await firstTd.click();
    await expect(firstTd).not.toContainClass(selectedClassName);
    await lastTd.click();
    await expect(lastTd).not.toContainClass(selectedClassName);
  });

  const date15thCell = page.getByRole("gridcell", { name: "15" });
  await date15thCell.click();
  await expect(date15thCell).toContainClass(selectedClassName);

  await test.step("При переходе на другой месяц и возврате, выбранная дата по-прежнему подсвечивается", async () => {
    await page.getByRole("button", { name: "prev month" }).click();
    await expect(date15thCell).not.toContainClass(selectedClassName);
    await page.getByRole("button", { name: "next month" }).click();
    await expect(date15thCell).toContainClass(selectedClassName);
  });
});

test("Можно выбрать год и месяц", async ({page}) => {
  const calendar = page.getByTestId("basic");
  const selected = calendar.locator(".selected");

  await test.step("Текущий год и месяц должен быть выделен", async () => {
    await page.getByRole("heading", { name: "февраль 2026 г" }).click();
    await expect(selected).toHaveText("2026");
    await expect(selected).toBeInViewport();

    await page.getByRole("gridcell", { name: "2026" }).click();
    await expect(selected).toHaveText("февр.");
    await page.getByRole("heading", { name: "февраль 2026 г" }).click();
  });

  await test.step("Меняем год и месяц, текущая выбранная дата не должна быть выделена", async () => {
    await page.getByRole("heading", { name: "февраль 2026 г" }).click();
    await page.getByRole("gridcell", { name: "1986" }).click();
    await page.getByRole("gridcell", { name: "авг" }).click();

    await expect(selected).toBeHidden();
  });

  await test.step("Возаращаемся на предыдущий диапазон, даты выделена", async () => {
    await page.getByRole("heading", { name: "август 1986 г" }).click();
    await page.getByRole("gridcell", { name: "2026" }).click();
    await page.getByRole("gridcell", { name: "февр" }).click();

    await expect(selected).toBeVisible();
  });

});

import { test, expect, type Locator, type Page } from "@playwright/test";
import { assert } from "@/utils/assert";

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

test.only("Выделение даты, даты предыдущего и следующего месяца нельзя выбрать", async ({page}) => {
  const calendar = page.getByTestId("basic");
  const selectedClassName = "selected";

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

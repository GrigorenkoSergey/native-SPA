import { test, expect, type Locator, type Page } from "@playwright/test";
import { assert } from "@/utils/assert";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 1, 14));
  await page.goto("http://localhost:8082/pages/custom-calendar/");
});

test.only("Отображение и переключение месяцев", async ({page}) => {
  const calendar = page.getByTestId("basic");
  const firstTd = calendar.locator("td").first();
  const lastTd = calendar.locator("td").last();

  expect(page.getByRole("heading", { name: "Февраль" })).toContainText("Февраль 2026");
  expect(firstTd).toContainText("26");
  expect(lastTd).toContainText("1");

  await page.waitForTimeout(1000);
});

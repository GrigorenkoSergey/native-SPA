import { test, expect } from "@playwright/test";

test("Базовая логика переключений страниц", async ({ page }) => {
  await page.goto("http://localhost:8080/native-SPA/pages/page-1/");

  const input = page.getByRole("textbox");

  await test.step("Скрипты первой страницы исполняются", async () => {
    await input.fill("12345");
    await expect(page.getByText("12345")).toBeVisible();
  });

  await test.step("Память общая для обеих страниц (ввод в инпуте на первой странице должен отобразиться)", async () => {
    await page.getByRole("link", { name: "Page-2" }).click();
    await expect(page.getByText("12345")).toBeVisible();
  });

  await test.step("При возврате на первую страницу, скрипты по-прежнему исполняются и старые значения не затираются", async () => {
    await page.getByRole("link", { name: "Page-1" }).click();
    await input.fill("12345abc");
    await expect(page.getByText("12345abc")).toBeVisible();
  });

  await test.step("Логика обработки на второй странице по-прежнему выполняется", async () => {
    await page.getByRole("link", { name: "Page-2" }).click();
    await expect(page.getByText("12345abc")).toBeVisible();
  });

  await test.step("В глубоко вложенных страницах скрипты исполяются, стили применяются", async () => {
    await page.getByRole("link", { name: "Глубоко вложенная страница" }).click();
    await expect(page.getByTestId("created-span")).toBeVisible();
  });

  await test.step("Возрат на первую страницу по-прежнему работает как ожидается", async () => {
    await page.getByRole("link", { name: "Page-1" }).click();
    await expect(page.getByText("12345abc")).toBeVisible();
  });
});

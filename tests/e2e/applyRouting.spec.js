import { test, expect } from "@playwright/test";

const phrase1 = "Ах... Я хожу.";
const phrase2 = "Какой тебе больше нравится?";
const phrase3 = "Вот что. Когда идешь за медом - главное, чтоб пчелы тебя не заметили.";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2025, 8, 1, 12, 0, 0));
});

test("Базовая логика переключений страниц", async ({ page }) => {
  await page.goto("http://localhost:8080/native-SPA/pages/page-1/");

  const input = page.getByRole("textbox");
  const submit = page.getByRole("button", { name: "Отправить" });

  const winnieLink = page.getByRole("link", { name: "Винни" });
  const pigletLink = page.getByRole("link", { name: "Пятачок" });

  const pigletHeader = page.getByRole("heading", { name: "Пятачок" });
  const winnieHeader = page.getByRole("heading", { name: "Винни Пух" });

  const checkSendingMessage = async message => {
    await expect(page.getByText(message)).not.toBeInViewport();
    await input.fill(message);
    await submit.click();
    await expect(page.getByText(message)).toBeInViewport();

    await expect(input).toBeEmpty();
  };

  await test.step("Скрипты первой страницы исполняются", async () => {
    await expect(page).toHaveScreenshot("winnie-page-start.png");
    await checkSendingMessage(phrase1);
  });

  await test.step("Память общая для обеих страниц", async () => {
    await pigletLink.click();
    await expect(pigletHeader).toBeVisible();
    await expect(page.getByText(phrase1)).toBeInViewport();

    await checkSendingMessage(phrase2);
  });

  await test.step("При возврате на первую страницу, скрипты по-прежнему исполняются и старые значения не затираются", async () => {
    await winnieLink.click();
    await expect(winnieHeader).toBeVisible();
    await expect(page.getByText(phrase2)).toBeInViewport();

    await checkSendingMessage(phrase3);
  });

  await test.step("Логика обработки на второй странице по-прежнему выполняется", async () => {
    await pigletLink.click();
    await expect(pigletHeader).toBeVisible();
    await expect(page.getByText(phrase3)).toBeInViewport();
  });

  await test.step("В глубоко вложенных страницах скрипты исполяются, стили применяются", async () => {
    await page.getByRole("link", { name: "Глубоко вложенная страница" }).click();
    await expect(page.getByTestId("created-span")).toBeVisible();
  });

  await test.step("Возрат на первую страницу по-прежнему работает как ожидается", async () => {
    await winnieLink.click();
    await expect(winnieHeader).toBeVisible();
    await expect(page.getByText(phrase3)).toBeInViewport();
    await expect(page).toHaveScreenshot("winnie-page-end.png");
  });
});

test("Проверка перемещений по истории", async ({ page }) => {
  await page.goto("http://localhost:8080/native-SPA/pages/page-1/");

  const pigletLink = page.getByRole("link", { name: "Пятачок" });
  const pigletHeader = page.getByRole("heading", { name: "Пятачок" });
  const winnieHeader = page.getByRole("heading", { name: "Винни Пух" });

  await test.step("Обычные перемещения по ссылкам", async () => {
    await expect(winnieHeader).toBeVisible();

    await page.getByRole("textbox").fill(phrase1);
    await page.getByRole("button", { name: "Отправить" }).click();
    await expect(page.getByText(phrase1)).toBeVisible();

    await pigletLink.click();
    await expect(pigletHeader).toBeVisible();
    await expect(page.getByText(phrase1)).toBeVisible();

    await page.getByRole("link", { name: "Глубоко вложенная страница" }).click();
    await expect(page.getByRole("heading", { name: "Глубоко вложенная страница" })).toBeVisible();
    await expect(page.getByTestId("created-span")).toBeVisible();
  });

  await test.step("Начнем возврат по истории", async () => {
    await page.goBack();
    await expect(pigletHeader).toBeVisible();
    await expect(page.getByText(phrase1)).toBeVisible();

    await page.goBack();
    await expect(winnieHeader).toBeVisible();
    await expect(page.getByText(phrase1)).toBeVisible();

    await page.getByRole("textbox").fill(phrase2);
    await page.getByRole("button", { name: "Отправить" }).click();

    await page.goForward();
    await expect(pigletHeader).toBeVisible();
    await expect(page.getByText(phrase2)).toBeVisible();

    await page.goForward();
    await expect(page.getByRole("heading", { name: "Глубоко вложенная страница" })).toBeVisible();
    await expect(page.getByTestId("created-span")).toBeVisible();
  });
});

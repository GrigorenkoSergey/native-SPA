import { test, expect } from "@playwright/test";

const phrase1 = "Ах... Я хожу.";
const phrase2 = "Какой тебе больше нравится?";
const phrase3 = "Вот что. Когда идешь за медом - главное, чтоб пчелы тебя не заметили.";

test.skip();

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2025, 8, 1, 12, 0, 0));
});

test("Базовая логика переключений страниц. Хедеры подставляются в JS.", async ({ page }) => {
  await page.goto("http://localhost:8080/native-SPA/pages/page-1/");

  const input = page.getByRole("textbox");
  const submit = page.getByRole("button", { name: "Отправить" });

  const winnieLink = page.getByRole("link", { name: "Винни" });
  const pigletLink = page.getByRole("link", { name: "Пятачок" });

  const pigletHeader = page.getByRole("heading", { name: "Пятачок" });
  const winnieHeader = page.getByRole("heading", { name: "Винни Пух" });

  const checkSendingMessage = async (message: string) => {
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
  });
});

test("Проверка подхода синхронизации выпадашки с адресом в урле", async ({ page }) => {
  const input = page.locator("input[name=\"hero\"]");
  await test.step("Если урл пуст, в значении выпадашки так же пусто", async () => {
    await page.goto("http://localhost:8080/native-SPA/pages/page-1/page-1-deeper-page/");
    await expect(input).toHaveValue("");
  });

  const option1Text = "Иа";
  const option2Text = "Винни Пух";
  const option3Text = "Пятачок";

  await test.step("Если в урле есть какой-либо запрос, оно отобразится в выпадашке", async () => {
    await page.goto(`http://localhost:8080/native-SPA/pages/page-1/page-1-deeper-page/?hero=${option1Text}`);
    await expect(input).toHaveValue(option1Text);
  });

  const checkQueryIsInUrl = async (optionText: string) => {
    const heroQuery = await page.evaluate(() => decodeURI(new URLSearchParams(window.location.search).get("hero") || "") );
    await expect(() => expect(heroQuery).toEqual(optionText)).toPass();
  };

  await test.step("Изменения в выпадашке меняют урл", async () => {
    await input.click();

    await page.getByRole("option", { name: option2Text }).click();
    await checkQueryIsInUrl(option2Text);

    await input.click();
    await page.getByRole("option", { name: option3Text }).click();
    await checkQueryIsInUrl(option3Text);
  });

  await test.step("Переходы по истории меняют содержимое выпадашки", async () => {
    await page.goBack();
    await checkQueryIsInUrl(option2Text);
    await expect(input).toHaveValue(option2Text);

    await page.goBack();
    await checkQueryIsInUrl(option1Text);
    await expect(input).toHaveValue(option1Text);

    await page.goForward();
    await checkQueryIsInUrl(option2Text);
    await expect(input).toHaveValue(option2Text);

    await page.goForward();
    await checkQueryIsInUrl(option3Text);
    await expect(input).toHaveValue(option3Text);
  });
});

test("Проверка работоспособности динамических роутов", async ({ page }) => {
  await test.step("Первоначальный заход", async () => {
    await page.goto("http://localhost:8080/native-SPA/pages/dynamic/9999/");
    await expect(page.getByRole("heading", { name: "Hello, dynamic page 9999!" })).toBeVisible();
  });

  await test.step("Переход по ссылкам", async () => {
    const linkIds = [1, 2, 3];
    for (const id of linkIds) {
      await page.getByRole("link", { name: `Динамическая страница-${id}` }).click();
      await expect(page.getByRole("heading", { name: `Hello, dynamic page ${id}!` })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`\\?some_query=${id}`));
    }
  });

  await test.step("Возврат по истории", async () => {
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Hello, dynamic page 2!" })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole("heading", { name: "Hello, dynamic page 1!" })).toBeVisible();

    await page.goForward();
    await expect(page.getByRole("heading", { name: "Hello, dynamic page 2!" })).toBeVisible();
  });
});

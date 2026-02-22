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

test("Табуляция", async ({page}) => {
  await test.step("Сначала сфокусируемся на календарике", async () => {
    await page.getByRole("heading", { name: "февраль 2026 г" }).click(); // открыли таблицу с годами
    await page.getByRole("heading", { name: "февраль 2026 г" }).click(); // закрыли таблицу с годами
  });

  await test.step("Проверим порядок перебора", async () => {
    const order = [
      page.getByRole("button", { name: "prev month" }),
      page.getByRole("button", { name: "next month" }),
      page.getByRole("gridcell", { name: "14" }),
      page.getByRole("button", { name: "Сегодня" }),
      page.getByRole("button", { name: "Отмена" }),
      page.getByRole("button", { name: "OK" }),
    ];

    for (const locator of order) {
      await page.keyboard.press("Tab");
      await expect(locator).toBeFocused();
    }
  });
});

test.only("Возможность выбирать даты с помощью клавиатуры", async ({page}) => {
  const dateCellLocator = (date: number) => page.getByRole("gridcell", { 
    name: String(date), exact: true, 
  });

  await page.getByRole("gridcell", { name: "14", exact: true }).focus();

  await test.step("Простейшая навигация", async () => {
    await page.keyboard.down("ArrowLeft");
    await expect(dateCellLocator(13)).toBeFocused();
    await page.keyboard.down("ArrowRight");
    await expect(dateCellLocator(14)).toBeFocused();
    await page.keyboard.down("ArrowUp");
    await expect(dateCellLocator(7)).toBeFocused();
    await page.keyboard.down("ArrowDown");
    await expect(dateCellLocator(14)).toBeFocused();
  });

  await test.step("При движении налево, при достижении первой ячейки \
    перепрыгивает на последнюю ячейку предыдущей строки", async () => {
    await page.getByRole("gridcell", { name: "9", exact: true }).click();
    await page.keyboard.down("ArrowLeft");
    await expect(page.getByRole("gridcell", { name: "8", exact: true })).toBeFocused();
  });

  await test.step("При движении налево, при достижении границы \
    предыдущего месяца каленарик перестраивается", async () => {
    await page.getByRole("gridcell", { name: "1", exact: true }).first().click(); 
    await page.keyboard.down("ArrowLeft");
    await expect(page.getByRole("gridcell", { name: "31" }).last()).toBeFocused();
    await expect(page.getByRole("heading", { name: "январь 2026 г" })).toBeVisible();
  });

  await test.step("При переходе с 1-го января на 31 декабря, год меняется", async () => {
    await page.getByRole("gridcell", { name: "1", exact: true }).first().click(); 
    await page.keyboard.down("ArrowLeft");
    await expect(page.getByRole("gridcell", { name: "31" }).last()).toBeFocused();
    await expect(page.getByRole("heading", { name: "декабрь 2025 г" })).toBeVisible();
  });

  await test.step("При переходе с 31-го декабря на 1 января, год меняется", async () => {
    await page.getByRole("gridcell", { name: "31"}).last().click(); 
    await page.keyboard.down("ArrowRight");
    await expect(page.getByRole("gridcell", { name: "1", exact: true }).first()).toBeFocused();
    await expect(page.getByRole("heading", { name: "январь 2026 г" })).toBeVisible();
  });

  await test.step("При движении направо, при достижении границы \
    следующего месяца каленарик перестраивается", async () => {
    await page.getByRole("gridcell", { name: "31" }).last().click(); 
    await page.keyboard.down("ArrowRight");
    await expect(page.getByRole("gridcell", { name: "1", exact: true }).first()).toBeFocused();
    await expect(page.getByRole("heading", { name: "февраль 2026 г" })).toBeVisible();
  });

  // await test.step("При движении направо, ")
});

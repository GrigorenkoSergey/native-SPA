import { test, expect, Locator, Page } from "@playwright/test";

const expectSelected = async (locator: Locator, toBeSelected: boolean) => {
  if (toBeSelected) await expect(locator).toHaveAttribute("aria-selected", "true");
  else await expect(locator).not.toHaveAttribute("aria-selected");
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 1, 14));
  await page.goto("http://localhost:8082/pages/custom-calendar/");
});

test("Отображение и переключение месяцев", async ({page}) => {
  const calendar = page.getByTestId("basic");
  const firstTd = calendar.locator("td").first();
  const lastTd = calendar.locator("td").last();

  await expect(calendar.getByRole("heading", { name: "февраль" })).toContainText("февраль 2026");
  await expect(firstTd).toContainText("26");
  await expect(lastTd).toContainText("1");

  await test.step("Предыдущий месяц", async () => {
    await calendar.getByRole("button", { name: "prev month" }).click();
    await expect(calendar.getByRole("heading", { name: "январь" })).toContainText("январь 2026");
    await expect(firstTd).toContainText("29");
    await expect(lastTd).toContainText("1");
  });

  await test.step("Следующий месяц", async () => {
    await calendar.getByRole("button", { name: "next month" }).click();
    await expect(calendar.getByRole("heading", { name: "февраль" })).toContainText("февраль 2026");
    await expect(firstTd).toContainText("26");
    await expect(lastTd).toContainText("1");
  });
});

test("Выделение даты, даты предыдущего и следующего месяца нельзя выбрать", async ({page}) => {
  const calendar = page.getByTestId("basic");

  await test.step("По умолчанию выбрана текущая дата (если нет соответствующего атрибута)", async () => {
    const selected = calendar.locator("[aria-selected='true']");
    await expect(selected).toContainText("14");
  });

  await test.step("Даты предыдущего и следующего месяца нельзы выбрать в текущем календарике", async () => {
    const firstTd = calendar.locator("td").first();
    const lastTd = calendar.locator("td").last();

    await firstTd.click();
    await expectSelected(firstTd, false);
    await lastTd.click();
    await expectSelected(lastTd, false);
  });

  const date15thCell = calendar.getByRole("gridcell", { name: "15" });
  await date15thCell.click();
  await expectSelected(date15thCell, true);

  await test.step("При переходе на другой месяц и возврате, выбранная дата по-прежнему подсвечивается", async () => {
    await calendar.getByRole("button", { name: "prev month" }).click();

    await expectSelected(date15thCell, false);
    await calendar.getByRole("button", { name: "next month" }).click();
    await expectSelected(date15thCell, true);
  });
});

test("Можно выбрать год и месяц", async ({page}) => {
  const calendar = page.getByTestId("basic");
  const selected = calendar.locator("[aria-selected='true']");

  await test.step("Текущий год и месяц должен быть выделен", async () => {
    await calendar.getByRole("heading", { name: "февраль 2026 г" }).click();
    await expect(selected).toHaveText("2026");
    await expect(selected).toBeInViewport();

    await calendar.getByRole("gridcell", { name: "2026" }).click();
    await expect(selected).toHaveText("февр.");
    await calendar.getByRole("heading", { name: "февраль 2026 г" }).click();
  });

  await test.step("Меняем год и месяц, текущая выбранная дата не должна быть выделена", async () => {
    await calendar.getByRole("heading", { name: "февраль 2026 г" }).click();
    await calendar.getByRole("gridcell", { name: "1986" }).click();
    await calendar.getByRole("gridcell", { name: "авг" }).click();

    await expect(selected).toBeHidden();
  });

  await test.step("Возаращаемся на предыдущий диапазон, даты выделена", async () => {
    await calendar.getByRole("heading", { name: "август 1986 г" }).click();
    await calendar.getByRole("gridcell", { name: "2026" }).click();
    await calendar.getByRole("gridcell", { name: "февр" }).click();

    await expect(selected).toBeVisible();
  });
});

test("Табуляция", async ({page}) => {
  const calendar = page.getByTestId("basic");

  await test.step("Сначала сфокусируемся на календарике", async () => {
    await calendar.getByRole("heading", { name: "февраль 2026 г" }).click(); // открыли таблицу с годами
    await calendar.getByRole("heading", { name: "февраль 2026 г" }).click(); // закрыли таблицу с годами
  });

  await test.step("Проверим порядок перебора", async () => {
    const order = [
      calendar.getByRole("button", { name: "prev month" }),
      calendar.getByRole("button", { name: "next month" }),
      calendar.getByRole("gridcell", { name: "14" }),
      calendar.getByRole("button", { name: "Сегодня" }),
      calendar.getByRole("button", { name: "Отмена" }),
      calendar.getByRole("button", { name: "OK" }),
    ];

    for (const locator of order) {
      await page.keyboard.press("Tab");
      await expect(locator).toBeFocused();
    }
  });

  await test.step("Фокусировка на датах возможна даже при отсутствии выделенной даты (будет выбрано 1-е число)", async () => {
    await calendar.getByRole("button", { name: "next month" }).click();
    await page.keyboard.press("Tab");
    await expect(calendar.getByRole("gridcell", { name: "1", exact: true }).first()).toBeFocused();
  });
});

test("Возможность выбирать даты с помощью клавиатуры", async ({page}) => {
  const calendar = page.getByTestId("basic");

  const dateCellLocator = (date: number) => calendar.getByRole("gridcell", { 
    name: String(date), exact: true, 
  });

  await calendar.getByRole("gridcell", { name: "14", exact: true }).focus();

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
    await calendar.getByRole("gridcell", { name: "9", exact: true }).click();
    await page.keyboard.down("ArrowLeft");
    await expect(dateCellLocator(8)).toBeFocused();
  });

  await test.step("При движении налево, при достижении границы \
    предыдущего месяца каленарик перестраивается", async () => {
    await calendar.getByRole("gridcell", { name: "1", exact: true }).first().click(); 
    await page.keyboard.down("ArrowLeft");
    await expect(dateCellLocator(31).last()).toBeFocused();
    await expect(calendar.getByRole("heading", { name: "январь 2026 г" })).toBeVisible();
  });

  await test.step("При переходе с 1-го января на 31 декабря, год меняется", async () => {
    await dateCellLocator(1).first().click(); 
    await page.keyboard.down("ArrowLeft");
    await expect(dateCellLocator(31).last()).toBeFocused();
    await expect(calendar.getByRole("heading", { name: "декабрь 2025 г" })).toBeVisible();
  });

  await test.step("При переходе с 31-го декабря на 1 января, год меняется", async () => {
    await calendar.getByRole("gridcell", { name: "31"}).last().click(); 
    await page.keyboard.down("ArrowRight");
    await expect(dateCellLocator(1).first()).toBeFocused();
    await expect(calendar.getByRole("heading", { name: "январь 2026 г" })).toBeVisible();
  });

  await test.step("При движении направо, при достижении границы \
    следующего месяца каленарик перестраивается", async () => {
    await calendar.getByRole("gridcell", { name: "31" }).last().click(); 
    await page.keyboard.down("ArrowRight");
    await expect(dateCellLocator(1).first()).toBeFocused();
    await expect(calendar.getByRole("heading", { name: "февраль 2026 г" })).toBeVisible();
  });

  await test.step("При движении наверх, при достижении границы \
    следующего месяца календарик перестраивается", async () => {
    await expect(dateCellLocator(1).first()).toBeFocused();
    await page.keyboard.down("ArrowUp");
    await expect(dateCellLocator(25)).toBeFocused();
    await expect(calendar.getByRole("heading", { name: "январь 2026 г" })).toBeVisible();
  });

  await test.step("При движении наверх, год так же может поменяться", async () => {
    await dateCellLocator(1).first().click();
    await page.keyboard.down("ArrowUp");
    await expect(dateCellLocator(25)).toBeFocused();
    await expect(calendar.getByRole("heading", { name: "декабрь 2025 г" })).toBeVisible();
  });

  await test.step("При движении вниз, год так же может поменяться", async () => {
    await page.keyboard.down("ArrowDown");

    await expect(dateCellLocator(1).first()).toBeFocused();

    await expect(calendar.getByRole("heading", { name: "январь 2026 г" })).toBeVisible();
  });
});

test("Выбор ячеек с клавиатуры", async ({page}) => {
  const calendar = page.getByTestId("basic");
  await calendar.getByRole("gridcell", { name: "14" }).focus();

  await test.step("Выбор ячейки дат по Enter и Space", async () => {
    let leftCell = calendar.getByRole("gridcell", { name: "13" });
    await page.keyboard.press("ArrowLeft");

    await expectSelected(leftCell, false);
    await expect(leftCell).toBeFocused();

    await page.keyboard.down("Enter");
    await expectSelected(leftCell, true);

    leftCell = calendar.getByRole("gridcell", { name: "12" });
    await page.keyboard.down("ArrowLeft");
    await expectSelected(leftCell, false);
    await page.keyboard.down("Space");
    await expectSelected(leftCell, true);
  });
});

test("Выбор года с помощью клавиатуры", async ({page}) => {
  const calendar = page.getByTestId("basic");

  await calendar.getByRole("heading", { name: "февраль 2026 г" }).click();

  await test.step("Выбираем год и месяц", async () => {
    const currentYearCell = calendar.getByRole("gridcell", { name: "2026" });
    await expectSelected(currentYearCell, true);
    await expect(currentYearCell).toBeFocused();

    await page.keyboard.down("Enter");
    await expectSelected(calendar.getByRole("gridcell", { name: "февр" }), true);
    await page.keyboard.down("ArrowLeft");
    await page.keyboard.down("Space");

    await expect(calendar.getByRole("heading", { name: "январь 2026 г" })).toBeVisible();
  });

  await test.step("При нажатии \"Tab\" мы по-прежнему переходим к кнопке переключения месяца", async () => {
    await page.waitForTimeout(50);
    await page.keyboard.down("Tab");
    await expect(calendar.getByRole("button", { name: "prev month" })).toBeFocused();
  });
});

test("Отбражение выделенного элемента в таблице с годами", async ({page}) => {
  const calendar = page.getByTestId("basic");

  await calendar.getByRole("heading", { name: "февраль 2026 г" }).click();

  await test.step("Прокрутка плавно следует за фокусом (если элемент полностью не виден)", async () => {
    for (let i = 0; i <= 20; i++) {
      await page.keyboard.down("ArrowDown");
      const focused = page.locator("td:focus");
      await expect(focused).toBeInViewport({ratio: 1});
    }

    for (let i = 0; i <= 20; i++) {
      await page.keyboard.down("ArrowUp");
      const focused = page.locator("td:focus");
      await expect(focused).toBeInViewport({ratio: 1});
    }
  });

  await test.step("При открытии таблицы выбора года, год виден полностью (прокрутка к выделенному)", async () => {
    const problemCell = calendar.getByRole("gridcell", { name: "1986" });
    await problemCell.click();
    await calendar.getByRole("gridcell", { name: "февр" }).click();

    const headingButton = calendar.locator("#year-month-toggler");
    await expect(headingButton).toBeFocused();
    await page.keyboard.down("Enter");
    await expect(problemCell).toBeInViewport({ratio: 1});
  });

  await test.step("При этом прокрутка мышью не зацикливается на этом элементе", async () => {
    await page.waitForTimeout(50); // дадим прокрутить к ячейке
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(200); // убедимся, что браузер закончил прокрутку полностью

    const problemCell = calendar.getByRole("gridcell", { name: "1986" });
    await expect(problemCell).not.toBeInViewport();
  });
});

test.describe("Дополнительные кнопки клавиатуры для по датам", async () => {
  const resetCalendar = async (page: Page) => {
    await page.evaluate(() => {
      const calendarNode = document.querySelector("[data-testid='basic']");
      if (calendarNode) {
        calendarNode.setAttribute("date", "Sat Feb 14 2026");
        calendarNode.setAttribute("month", "1");
        calendarNode.setAttribute("year", "2026");
      }
    });
  };

  test("Home + End", async ({page}) => {
    const calendar = page.getByTestId("basic");

    await test.step("Home + End", async () => {
      await calendar.getByRole("gridcell", { name: "14" }).focus();

      await page.keyboard.down("Home");
      await expect(calendar.getByRole("gridcell", { name: "9", exact: true })).toBeFocused();

      await page.keyboard.down("End");
      await expect(calendar.getByRole("gridcell", { name: "15" })).toBeFocused();
      await expectSelected(calendar.getByRole("gridcell", { name: "15" }), false);
    });
  });

  test("PageUp", async ({page}) => {
    const calendar = page.getByTestId("basic");

    await test.step("PageUp - переход на предыдущий месяц", async () => {
      await calendar.getByRole("gridcell", { name: "14" }).focus();

      await page.keyboard.down("PageUp");

      await expect(calendar.getByRole("heading", { name: "январь 2026 г" })).toBeVisible();
      await expectSelected(calendar.getByRole("gridcell", { name: "14" }), false);
      await expect(calendar.getByRole("gridcell", { name: "14" })).toBeFocused();

      await calendar.getByRole("gridcell", { name: "31" }).last().click();
      await page.keyboard.down("PageUp");

      await expect(calendar.getByRole("heading", { name: "декабрь 2025 г" })).toBeVisible();
      await expect(calendar.getByRole("gridcell", { name: "31" }).last()).toBeFocused();
      await page.keyboard.down("PageUp");

      await expect(calendar.getByRole("heading", { name: "ноябрь 2025 г" })).toBeVisible();

      const lastCell = calendar.getByRole("gridcell", { name: "30" }).last();
      await expect(lastCell).toBeFocused();
      await expectSelected(lastCell, false);

      await page.keyboard.down("Space");
      await expect(lastCell).toBeFocused();
      await expectSelected(lastCell, true);
    });

    await resetCalendar(page);

    await test.step("Shift + PageUp - переход на предыдущий год", async () => {
      await calendar.getByRole("gridcell", { name: "14" }).focus();

      await page.keyboard.down("Shift");
      await page.keyboard.down("PageUp");
      await page.keyboard.up("Shift");

      // 2020 февраль - 29 дней
      await expect(calendar.getByRole("heading", { name: "февраль 2025 г" })).toBeVisible();
      await expect(calendar.getByRole("gridcell", { name: "14" })).toBeFocused();
      await expectSelected(calendar.getByRole("gridcell", { name: "14" }), false);
    });

    await resetCalendar(page);

    await test.step("Shift + PageUp - высокосный год", async () => {
      await page.evaluate(() => {
        const calendarNode = document.querySelector("[data-testid='basic']");
        if (calendarNode) {
          calendarNode.setAttribute("month", "1");
          calendarNode.setAttribute("year", "2020");
          calendarNode.setAttribute("date", "Sun Feb 29 2020");
        }
      });

      await calendar.getByRole("gridcell", { name: "29" }).nth(1).focus();
      await page.keyboard.down("Shift");
      await page.keyboard.down("PageUp");
      await page.keyboard.up("Shift");
      await expect(calendar.getByRole("heading", { name: "февраль 2019 г" })).toBeVisible();
      await expect(calendar.getByRole("gridcell", { name: "28" }).nth(1)).toBeFocused();
    });
  });

  test("PageDown", async ({page}) => {
    const calendar = page.getByTestId("basic");

    await test.step("PageDown, переход на следующий месяц", async () => {
      await calendar.getByRole("gridcell", { name: "14" }).focus();

      await page.keyboard.down("PageDown");
      await expect(calendar.getByRole("heading", { name: "март 2026 г" })).toBeVisible();
      await expectSelected(calendar.getByRole("gridcell", { name: "14" }), false);
      await expect(calendar.getByRole("gridcell", { name: "14" })).toBeFocused();

      await calendar.getByRole("gridcell", { name: "31" }).last().click();
      await page.keyboard.down("PageDown");

      await expect(calendar.getByRole("heading", { name: "апрель 2026 г" })).toBeVisible();
      const lastCell = calendar.getByRole("gridcell", { name: "30" }).last();
      await expect(lastCell).toBeFocused();
      await expectSelected(lastCell, false);
      await page.keyboard.down("Enter");
      await expectSelected(lastCell, true);
    });

    await test.step("Shift + PageDown, переход на следующий год", async () => {
      await page.evaluate(() => {
        const calendarNode = document.querySelector("[data-testid='basic']");
        if (calendarNode) {
          calendarNode.setAttribute("month", "1");
          calendarNode.setAttribute("year", "2020");
          calendarNode.setAttribute("date", "Sun Feb 29 2020");
        }
      });

      await calendar.getByRole("gridcell", { name: "29" }).last().focus();
      await page.keyboard.down("Shift");
      await page.keyboard.down("PageDown");
      await page.keyboard.up("Shift");
      await expect(calendar.getByRole("heading", { name: "февраль 2021 г" })).toBeVisible();
      await expect(calendar.getByRole("gridcell", { name: "28" }).last()).toBeFocused();
    });
  });
});

test.describe("Минимальные, максимальные года", async () => {
  test.beforeEach(async ({page}) => {
    await page.evaluate(() => {
      const calendarNode = document.querySelector("[data-testid='basic']");
      if (calendarNode) {
        calendarNode.setAttribute("min-year", "2010");
        calendarNode.setAttribute("max-year", "2030");
      }
    });
  });

  test("Минимальный год", async ({page}) => {
    const calendar = page.getByTestId("basic");

    await test.step("Приблизимся к нижней границе", async () => {
      await calendar.getByRole("heading", { name: "февраль 2026 г" }).click();
      await calendar.getByRole("gridcell", { name: "2010" }).click();
      await calendar.getByRole("gridcell", { name: "янв" }).click();
      await calendar.getByRole("gridcell", { name: "1", exact: true }).first().click();
    });

    await test.step("Нельзя выйти за нижний предел с помощью кнопок", async () => {
      await expect(calendar.getByRole("heading", { name: "январь 2010 г" })).toBeVisible();
      await expect(calendar.getByRole("button", { name: "prev month" })).toBeDisabled();
    });

    await test.step("Блокировка и разблокировка стрелки на предыдущий месяц", async () => {
      await calendar.getByRole("button", { name: "next month" }).click();
      await expect(calendar.getByRole("heading", { name: "февраль 2010 г" })).toBeVisible();

      await calendar.getByRole("button", { name: "prev month" }).click();
      await expect(calendar.getByRole("heading", { name: "январь 2010 г" })).toBeVisible();
      await expect(calendar.getByRole("button", { name: "prev month" })).toBeDisabled();
    });

    await test.step("Нельзя выйти за нижний предел с помощью клавиатуры", async () => {
      await calendar.getByRole("gridcell", { name: "1", exact: true }).focus();
      await page.keyboard.down("ArrowLeft");
      await page.waitForTimeout(50);
      await expect(calendar.getByRole("heading", { name: "январь 2010 г" })).toBeVisible();

      await page.keyboard.down("ArrowUp");
      await page.waitForTimeout(50);
      await expect(calendar.getByRole("heading", { name: "январь 2010 г" })).toBeVisible();

      await page.keyboard.down("PageUp");
      await page.waitForTimeout(50);
      await expect(calendar.getByRole("heading", { name: "январь 2010 г" })).toBeVisible();

      await page.keyboard.down("Shift");
      await page.keyboard.down("PageUp");
      await page.keyboard.up("Shift");
      await page.waitForTimeout(50);
      await expect(calendar.getByRole("heading", { name: "январь 2010 г" })).toBeVisible();
    });
  });

  test("Максимальный год", async ({page}) => {
    const calendar = page.getByTestId("basic");
  
    await test.step("Приблизимся к верхней границе", async () => {
      await calendar.getByRole("heading", { name: "февраль 2026 г" }).click();
      await calendar.getByRole("gridcell", { name: "2030" }).click();
      await calendar.getByRole("gridcell", { name: "дек" }).click();
      await calendar.getByRole("gridcell", { name: "31", exact: true }).last().click();
    });

    await test.step("Нельзя выйти за верхний предел с помощью кнопок", async () => {
      await expect(calendar.getByRole("heading", { name: "декабрь 2030 г" })).toBeVisible();
      await expect(calendar.getByRole("button", { name: "next month" })).toBeDisabled();
    });

    await test.step("Блокировка и разблокировка стрелки на следующий месяц", async () => {
      await calendar.getByRole("button", { name: "prev month" }).click();
      await expect(calendar.getByRole("heading", { name: "ноябрь 2030 г" })).toBeVisible();

      await calendar.getByRole("button", { name: "next month" }).click();
      await expect(calendar.getByRole("heading", { name: "декабрь 2030 г" })).toBeVisible();
      await expect(calendar.getByRole("button", { name: "next month" })).toBeDisabled();
    });

    await test.step("Нельзя выйти за верхний предел с помощью клавиатуры", async () => {
      await calendar.getByRole("gridcell", { name: "31" }).focus();
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(50);
      await expect(calendar.getByRole("heading", { name: "декабрь 2030 г." })).toBeVisible();

      await page.keyboard.down("ArrowDown");
      await page.waitForTimeout(50);
      await expect(calendar.getByRole("heading", { name: "декабрь 2030 г." })).toBeVisible();

      await page.keyboard.down("PageDown");
      await page.waitForTimeout(50);
      await expect(calendar.getByRole("heading", { name: "декабрь 2030 г." })).toBeVisible();

      await page.keyboard.down("Shift");
      await page.keyboard.down("PageDown");
      await page.keyboard.up("Shift");
      await page.waitForTimeout(50);
      await expect(calendar.getByRole("heading", { name: "декабрь 2030 г." })).toBeVisible();
    });
  });
});

test("Кнопка 'Сегодня' выбирает текущую дату (14 февраля)", async ({page}) => {
  const calendar = page.getByTestId("basic");
  await test.step("С помощью мышки", async () => {
    await calendar.getByRole("button", { name: "next month" }).click();
    await expect(calendar.getByRole("heading", { name: "март 2026 г" })).toBeVisible();
    await calendar.getByRole("gridcell", { name: "19" }).click();

    const selected = calendar.locator("[aria-selected='true']");
    await expect(selected).toContainText("19");

    await calendar.getByRole("button", { name: "Сегодня" }).click();

    await expect(calendar.getByRole("heading", { name: "февраль 2026 г" })).toBeVisible();
    await expect(selected).toContainText("14");
  });

  await test.step("С помощью клавиатуры", async () => {
    await calendar.getByRole("button", { name: "next month" }).focus();
    await page.keyboard.down("Enter");

    await expect(calendar.getByRole("heading", { name: "март 2026 г" })).toBeVisible();
    await calendar.getByRole("gridcell", { name: "19" }).focus();
    await page.keyboard.down("Enter");

    const selected = calendar.locator("[aria-selected='true']");
    await expect(selected).toContainText("19");

    await page.keyboard.down("Tab"); 
    await page.keyboard.down("Enter");

    await expect(calendar.getByRole("heading", { name: "февраль 2026 г" })).toBeVisible();
    await expect(selected).toContainText("14");
  });
});

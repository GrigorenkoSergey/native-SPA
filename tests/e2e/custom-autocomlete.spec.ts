import { test, expect, type Locator, type Page } from "@playwright/test";
import { assert } from "@/utils/assert";

let elem: Locator;
let input: Locator;
let page: Page;

const totalOptionsCount = 5;
const option1Text = "Опция-1";
const option2Text = "Опция-2";

test.beforeEach(async ({ page: testPage }) => {
  page = testPage;

  await page.goto("http://localhost:8082/pages/custom-autocomplete/");
  elem = page.getByTestId("basic");
  input = elem.getByRole("textbox");
});

const checkIsOpen = async () => {
  await expect(elem).toHaveAttribute("open");
  await expect(elem).toHaveAttribute("aria-expanded", "true");
  await expect(elem.getByRole("option").nth(0)).toBeInViewport();
};

const checkIsClosed = async () => {
  await expect(elem).not.toHaveAttribute("open");
  await expect(elem).toHaveAttribute("aria-expanded", "false");
  await expect(elem.getByRole("option").nth(0)).not.toBeInViewport();
};

/**
 * @param optionText - Текстовое значение опции, которая должна быть выбрана.
 */
const checkIsOptionSelected = async (optionText: string) => {
  await expect(input).toHaveValue(optionText);
  await expect(elem.getByRole("option").filter({ hasText: optionText })).toHaveAttribute("aria-selected", "true");
  await expect(elem.locator("[aria-selected='true']")).toHaveCount(1);
};

/**
 *
 * @param maxRenders - ожидаемое кол-во рендеров
 */
const checkExpectedRendersCount = async (maxRenders: number) => {
  const rendersCount = page.getByTestId("basic-renders-count");
  await expect(rendersCount).toHaveText(String(maxRenders));
};

/**
 *
 * @param optionText - опция, которую нужно выбрать. После выбора элемент будет закрыт.
 */
const selectOption = async (optionText: string) => {
  const hasOpenAttr = (await elem.getAttribute("open")) !== null;
  if (!hasOpenAttr) await elem.click();

  await checkIsOpen();

  await elem.getByRole("option", { name: optionText }).click();
  await expect(elem.getByRole("textbox")).toHaveValue(optionText);
};

test("Простой выбор опций", async () => {
  await test.step("Работает простой выбор опций", async () => {
    await elem.click();
    await checkIsOpen();

    await elem.getByRole("option", { name: option1Text }).click();
    await expect(elem.getByRole("textbox")).toHaveValue(option1Text);
    await checkIsClosed();
  });

  await test.step("Выбранная опция выделена в списке", async () => {
    await elem.click();
    const options = elem.getByRole("option");
    await expect(options).toHaveCount(totalOptionsCount);
    await checkIsOptionSelected(option1Text);
  });
});

test("Открытие-закрытие по клику", async () => {
  let expectedRenders = 0;

  await test.step("Открытие по клику", async () => {
    await elem.click();
    expectedRenders += 1;
    await checkIsOpen();
    await checkExpectedRendersCount(expectedRenders);
  });

  await test.step("Закрытие по повторному клику на поле ввода", async () => {
    await elem.click();
    expectedRenders += 1;
    await checkIsClosed();
    await checkExpectedRendersCount(expectedRenders);
  });

  await test.step("Нет лишнего рендера по клику снаружи после закрытия", async () => {
    await page.getByTestId("basic-section-title").click();
    await checkExpectedRendersCount(expectedRenders);
  });

  await test.step("Открытие по клику, закрытие по клику вне элемента", async () => {
    await elem.click();
    expectedRenders += 1;
    await checkIsOpen();
    await page.getByTestId("basic-section-title").click();
    expectedRenders += 1;
    await checkIsClosed();

    await checkExpectedRendersCount(expectedRenders);
  });

  await test.step("Закрытие при выборе опции", async () => {
    await elem.click();
    expectedRenders += 1;
    await elem.getByRole("option", { name: option1Text }).click();
    expectedRenders += 1;
    await checkIsClosed();

    await checkExpectedRendersCount(expectedRenders);
  });

  await test.step("Повторный клик снаружи после выбора нескольких опций по-прежнему закрывает элемент", async () => {
    await elem.click();
    expectedRenders += 1;
    await checkIsOpen();

    await page.getByTestId("basic-section-title").click();
    expectedRenders += 1;
    await checkIsClosed();
    await checkExpectedRendersCount(expectedRenders);
  });
});

test("Фильтрация по вводу", async () => {
  await test.step("Работает фильтрация по вводу", async () => {
    await elem.click();
    await input.fill("Опци");
    await expect(elem.getByRole("option")).toHaveCount(totalOptionsCount);

    await input.fill("2");
    await expect(elem.getByRole("option")).toHaveCount(1);
    await expect(elem.getByRole("option", { name: option2Text })).toBeVisible();
  });

  await test.step("При сбросе фильтрации (удалении ввода) список отображается полностью", async () => {
    await input.fill("");
    await expect(elem.getByRole("option")).toHaveCount(totalOptionsCount);
  });
});

test("Очистка ввода", async () => {
  const checkOptionIsNotSelected = async (optionText: string) => {
    await expect(elem.getByRole("option").filter({ hasText: optionText })).not.toHaveAttribute("aria-selected", "true");
  };

  await test.step("Очистка в закрытом состоянии", async () => {
    await elem.click();
    await selectOption(option1Text);
    await input.fill("");

    await elem.click();
    await checkOptionIsNotSelected(option1Text);
  });

  await test.step("Очистка в открытом состоянии", async () => {
    await selectOption(option1Text);
    await elem.click(); // открыли
    await input.fill("");

    await checkOptionIsNotSelected(option1Text);
    await elem.click(); // закрыли
    await elem.click(); // открыли
    await checkOptionIsNotSelected(option1Text);
  });
});

test("Навигация с клавиатуры", async () => {
  await test.step("Открытие и закрытие списка", async () => {
    await input.press("ArrowDown");
    await expect(elem).toHaveAttribute("aria-expanded", "true");

    await input.press("Escape");
    await expect(elem).toHaveAttribute("aria-expanded", "false");
  });

  await test.step("Перемещение по списку вниз", async () => {
    await input.press("ArrowDown");
    await input.press("ArrowDown");
    await expect(elem.getByRole("option", { name: option1Text })).toHaveClass(/keyboard-focused/);

    await input.press("ArrowDown");
    await expect(elem.getByRole("option", { name: option1Text })).not.toHaveClass(/keyboard-focused/);
    await expect(elem.getByRole("option", { name: option2Text })).toHaveClass(/keyboard-focused/);
  });

  await test.step("Перемещение по списку вверх", async () => {
    await input.press("ArrowUp");
    await expect(elem.getByRole("option", { name: option2Text })).not.toHaveClass(/keyboard-focused/);
    await expect(elem.getByRole("option", { name: option1Text })).toHaveClass(/keyboard-focused/);
  });

  await test.step("Выбор опции по Enter", async () => {
    await input.press("Enter");
    await expect(elem.getByRole("textbox")).toHaveValue(option1Text);
    await checkIsClosed();
  });

  await test.step("При потере фокуса с элемента список закрывается", async () => {
    await elem.click();
    await checkIsOpen();
    await page.keyboard.press("Tab");
    await checkIsClosed();
  });
});

test("При нажатии на стрелки клавиатуры при отсутствии элементов для выбора рендер не происходит", async () => {
  let expectedRenders = 0;
  await elem.click();
  expectedRenders += 1;

  await input.fill("W");
  expectedRenders += 1;
  await checkExpectedRendersCount(expectedRenders);
  await expect(elem.getByRole("option")).toHaveCount(0);

  await page.keyboard.down("ArrowUp");
  await page.keyboard.down("ArrowUp");
  await page.keyboard.down("ArrowDown");
  await page.keyboard.down("ArrowDown");
  await checkExpectedRendersCount(expectedRenders);
});

test("Изменения атрибутов снаружи", async () => {
  let expectedRenders = 0;

  await test.step("Смена value", async () => {
    await page.evaluate(option2Text => {
      const elem = document.querySelector("[data-testid=basic]");
      elem?.setAttribute("value", option2Text);
    }, option2Text);
    expectedRenders += 1;

    await elem.click();
    expectedRenders += 1;

    await checkIsOptionSelected(option2Text);
    await checkExpectedRendersCount(expectedRenders);
  });

  await elem.click();
  expectedRenders += 1;

  await test.step("Смена open", async () => {
    await page.evaluate(() => {
      const elem = document.querySelector("[data-testid=basic]");
      elem?.setAttribute("open", "");
    });
    expectedRenders += 1;

    await checkIsOptionSelected(option2Text);
    await checkIsOpen();
    await checkExpectedRendersCount(expectedRenders);
  });

  await test.step("Смена нескольких атрибутов синхронно", async () => {
    await page.evaluate(option1Text => {
      const elem = document.querySelector("[data-testid=basic]");
      elem?.setAttribute("value", option1Text);
      elem?.removeAttribute("open");
    }, option1Text);

    await expect(input).toHaveValue(option1Text);
    await checkIsClosed();
  });
});

test("Изменения опций снаружи", async () => {
  let expectedRenders = 0;

  await test.step("Смена value", async () => {
    await page.evaluate(option2Text => {
      const elem = document.querySelector("[data-testid=basic]");
      if (elem && "value" in elem) elem.value = option2Text;
    }, option2Text);
    expectedRenders += 1;

    await elem.click();
    expectedRenders += 1;

    await checkIsOptionSelected(option2Text);
    await checkExpectedRendersCount(expectedRenders);
  });

  await elem.click();
  expectedRenders += 1;

  await test.step("Смена open", async () => {
    await page.evaluate(() => {
      const elem = document.querySelector("[data-testid=basic]");
      if (elem && "open" in elem) elem.open = true;
    });
    expectedRenders += 1;

    await checkIsOptionSelected(option2Text);
    await checkIsOpen();
    await checkExpectedRendersCount(expectedRenders);
  });

  await test.step("Смена нескольких атрибутов синхронно", async () => {
    await page.evaluate(option1Text => {
      const elem = document.querySelector("[data-testid=basic]");
      if (elem) {
        elem.setAttribute("value", option1Text);
        elem.removeAttribute("open");
      }
    }, option1Text);

    await expect(input).toHaveValue(option1Text);
    await checkIsClosed();
  });
});

// Подробнее: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
test("Проверка основных ARIA атрибутов", async () => {
  await test.step("Комбобокс и инпут имеют правильные роли и атрибуты", async () => {
    await expect(elem).toHaveAttribute("role", "combobox");
    await expect(elem).toHaveAttribute("aria-haspopup", "listbox");
    await expect(input).toHaveAttribute("aria-autocomplete", "list");
  });

  await test.step("Атрибут aria-controls указывает на правильный список", async () => {
    await elem.click();
    const listboxId = await elem.getAttribute("aria-controls");
    expect(listboxId).not.toBeNull();

    const listbox = page.locator(`#${listboxId}`);
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute("role", "listbox");
  });

  await test.step("При выборе с клавиатуры, верно устанавливается aria-activedescendant", async () => {
    const checkHasAttr = async (option: Locator) => {
      const optionId = await option.getAttribute("id");
      assert(optionId !== null);
      await expect(input).toHaveAttribute("aria-activedescendant", optionId);
    };

    await input.press("ArrowDown");
    await checkHasAttr(elem.getByRole("option", { name: option1Text }));

    await input.press("ArrowDown");
    await checkHasAttr(elem.getByRole("option", { name: option2Text }));

    await input.press("Enter");
    await input.press("ArrowDown");
    await checkHasAttr(elem.getByRole("option", { name: option2Text }));
  });
});

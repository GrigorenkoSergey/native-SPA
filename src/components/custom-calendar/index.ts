import template from "./template.html";
import css from "./style.css?raw";
import { initCustomElement, attachStyles2 } from "@/utils/customElementHelpers";
import { assert } from "@/utils/assert";

// TODO можно вынести в хелперы
const style = document.createElement("style");
style.id = "default-style";
style.textContent = css;

const msInDay = 24 * 60 * 60 * 1000;

const monthDates = (d: string) => {
  const date = new Date(d);

  const startOfMonth = new Date(date).setDate(1);
  const endOfMonth = new Date(date).setFullYear(date.getFullYear(), date.getMonth() + 1, 0);
  const daysInCurrentMonth = (endOfMonth - startOfMonth) / (msInDay) + 1;

  const weekDayOfMonthStart = new Date(startOfMonth).getDay();
  const weekDayOfMonthEnd = new Date(endOfMonth).getDay();
  const daysFromPrevMonth = weekDayOfMonthStart === 0 ? 6 : weekDayOfMonthStart - 1;
  const daysFromNextMonth = weekDayOfMonthEnd === 0 ? 0 : 7 - weekDayOfMonthEnd;

  const daysInCalendar = daysFromPrevMonth + daysInCurrentMonth + daysFromNextMonth; 
  const dates = Array.from(
    {length: daysInCalendar}, 
    (_, i) => new Date(startOfMonth - (daysFromPrevMonth - i) * msInDay),
  );

  return dates;
};

const getHost = (elem: Element) => {
  const host = (elem.getRootNode() as ShadowRoot).host;
  assert(host instanceof CustomCalendar);
  return host;
};

type View = "dates" | "months" | "years";
type ArrowKey = "ArrowLeft" | "ArrowRight" | "ArrowDown" | "ArrowUp";

const defaultMinYear = 1970;
const defaultMaxYear = 2050;

// паттерн grid https://www.w3.org/WAI/ARIA/apg/patterns/grid/
export class CustomCalendar extends HTMLElement {
  [key: string]: unknown;
  ["constructor"]!: typeof CustomCalendar;

  shadowRoot!: ShadowRoot;
  observer!: IntersectionObserver;
  lastChangedAttr = "";

  // для всех инстансов
  static defaultStyles: (HTMLStyleElement | HTMLLinkElement)[] = [style];

  constructor() {
    super();
    this.attachShadow({mode: "open"});
  }

  static init() {
    // @ts-expect-error FIXME
    initCustomElement("custom-calendar", CustomCalendar);
  }

  static observedAttributes = ["year", "month","date", "view"] as const;

  prerenderAttrs = new Map(CustomCalendar.observedAttributes
    .map(attr => [attr, undefined as undefined | unknown]));

  hasChanged(attr: typeof CustomCalendar.observedAttributes[number]) {
    return this.prerenderAttrs.get(attr) !== this[attr];
  }

  get view(): View {
    return this.getAttribute("view") as View || "dates";
  }
  set view(value: View) {
    this.setAttribute("view", value);
  }

  get year() {
    return Number(this.getAttribute("year") || new Date().getFullYear());
  }

  get month() {
    return Number(this.getAttribute("month") || new Date().getMonth());
  }

  get date() {
    return this.getAttribute("date") || 
    new Date(this.year, this.month, Number(new Date().getDate())).toDateString();
  }

  get minYear() {
    if (!this.hasAttribute("min-year")) return defaultMinYear;

    const dateYear = new Date(this.date).getFullYear();
    const attrValue = Number(this.getAttribute("min-year"));
    return attrValue > dateYear ? defaultMinYear : attrValue;
  }

  get maxYear() {
    if (!this.hasAttribute("max-year")) return defaultMaxYear;

    const dateYear = new Date(this.date).getFullYear();
    const attrValue = Number(this.getAttribute("max-year"));
    return attrValue < dateYear ? defaultMinYear : attrValue;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = template;
    attachStyles2(this, CustomCalendar.defaultStyles);

    this.attachHandlers();
    this.setDefaultAttributes();

    const observerRoot = this.shadowRoot.querySelector(".tables-container");

    this.observer = new IntersectionObserver((entries) => {
      this.observer.disconnect();

      const [entry] = entries;
      if (!entry.isIntersecting) {
        entry.target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }, 
    { root: observerRoot, threshold: 1 }); 
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | boolean,
    newValue: string | boolean,
  ) {
    if (oldValue === newValue) return;

    this.lastChangedAttr = name;
    queueMicrotask(() => {
      if (this.lastChangedAttr !== name) return;

      const noChanges = [...this.prerenderAttrs.entries()]
        .every(([attr, value]) => this[attr] === value);
      if (noChanges) return;

      this.render();
      this.lastChangedAttr = "";
      this.prerenderAttrs.forEach((value, attr) => this.prerenderAttrs.set(attr, this[attr]));
    });
  }

  attachHandlers() {
    const nextMonthButton = this.shadowRoot.querySelector("#next-month");
    const prevMonthButton = this.shadowRoot.querySelector("#prev-month");
    nextMonthButton?.addEventListener("click", this.onNextMonthClick as EventListener);
    prevMonthButton?.addEventListener("click", this.onNextMonthClick as EventListener);

    const yearMonthToggler = this.shadowRoot.querySelector("#year-month-toggler");
    yearMonthToggler?.addEventListener("click", this.onYearSelectorClick as EventListener);

    this.shadowRoot.addEventListener("click", this.onDateClick as EventListener);
    this.shadowRoot.addEventListener("click", this.onYearTdClick as EventListener);
    this.shadowRoot.addEventListener("click", this.onMonthTdClick as EventListener);

    this.shadowRoot.addEventListener("keydown", this.onTdKeyDown as EventListener);
  }

  setDefaultAttributes() {
    const ensureAttribute = (name: string, value: string) => {
      if (!this.hasAttribute(name)) this.setAttribute(name, value);
    };

    ensureAttribute("view", "dates");
    ensureAttribute("date", this.date);
    ensureAttribute("month", String(this.month));
    ensureAttribute("year", String(this.year));
    ensureAttribute("min-year", String(this.minYear));
    ensureAttribute("max-year", String(this.maxYear));
  }

  render() {
    const view = this.view;

    if (this.hasChanged("month") || this.hasChanged("year") && view === "dates") {
      this.renderDates();
    }

    if (this.hasChanged("view")) {
      const tbodies = [...this.shadowRoot.querySelectorAll("tbody")];
      tbodies.forEach(tbody => tbody.innerHTML = "");

      if (view === "years") this.renderYears();
      else if (view === "months") this.renderMonths();
      else if (view === "dates") {
        this.renderDates();
        this.restrictTableHeight(false);
      }
    }

    this.highlightSelected(this.view);
    this.disableMonthArrowIfNeeded();
  }

  renderDates() {
    const visibledDates = monthDates(new Date(this.year, this.month).toString());
    const weeksInMonth = visibledDates.length / 7;

    let ptr = 0;
    const tbody = document.createElement("tbody");

    for (let week = 0; week < weeksInMonth; week++) {
      const tr = document.createElement("tr");

      for (let day = 0; day < 7; day++) {
        const pointedDate = visibledDates[ptr];

        const td = document.createElement("td");
        td.classList.add("date-cell");
        td.dataset.date = pointedDate.toDateString();
        td.textContent = String(pointedDate.getDate());
        td.tabIndex = -1;

        const cellMonth = pointedDate.getMonth();
        if (cellMonth !== this.month) td.setAttribute("disabled", "");

        tr.append(td);
        ptr += 1;
      }

      tbody.append(tr);
    }

    const oldTbody = this.shadowRoot.querySelector("tbody");
    assert(oldTbody);
    oldTbody.replaceWith(tbody);

    const h2 = this.shadowRoot.querySelector("#month-year");
    if (h2) h2.textContent = this.formatYearMonth(this.year, this.month);
  }

  renderYears() {
    const {minYear, maxYear} = this;
    const yearsPerRow = 4;
    const maxRows = Math.ceil((maxYear + 1 - minYear) / yearsPerRow);
    const tbody = document.createElement("tbody");

    for (let row = 0; row < maxRows; row++) {
      const tr = document.createElement("tr");

      for (let col = 0; col < yearsPerRow; col++) {
        const td = document.createElement("td");
        td.classList.add("year-cell");

        const year = String(minYear + (row * yearsPerRow) + col);
        if (Number(year) > maxYear) break;

        td.dataset.year = year;
        td.tabIndex = -1;
        td.textContent = year;

        tr.append(td);
      }

      tbody.append(tr);
    }

    this.shadowRoot.querySelector("#years tbody")?.replaceWith(tbody);

    const currentYearTd = tbody.querySelector(`[data-year="${this.year}"]`);

    assert(currentYearTd instanceof HTMLTableCellElement);
    currentYearTd.focus();
    this.observer.disconnect();
    this.observer.observe(currentYearTd);
  }

  renderMonths() {
    const tbody = document.createElement("tbody");
    const rows = 4;
    const cols = 3;

    for (let row = 0; row < rows; row++) {
      const tr = document.createElement("tr");
      for (let col = 0; col < cols; col++) {
        const td = document.createElement("td");
        td.classList.add("month-cell");

        const index = row * cols + col;
        td.dataset.month = String(index);
        td.tabIndex = -1;
        td.textContent = new Date(
          new Date().setMonth(index),
        ).toLocaleDateString(undefined, {month: "short"});

        tr.append(td);
      }
      tbody.append(tr);
    }

    this.shadowRoot.querySelector("#months tbody")?.replaceWith(tbody);

    const currentMonthTd = tbody.querySelector(`[data-month="${this.month}"]`);
    if (currentMonthTd instanceof HTMLTableCellElement) {
      currentMonthTd.focus();
    }
  }

  highlightSelected(view: View) {
    const {shadowRoot} = this;

    const selected = shadowRoot.querySelector("[aria-selected='true']");
    if (selected instanceof HTMLElement) {
      selected.ariaSelected = null;
      selected.tabIndex = -1;
    }

    const field = view.slice(0, -1); // dates -> date, months -> month...
    const selectedValue = this[field];
    const cell = shadowRoot.querySelector(`[data-${field}="${selectedValue}"]`);

    if (cell instanceof HTMLElement) {
      cell.ariaSelected = "true";
      cell.tabIndex = 0;
    } else {
      const firstTd = shadowRoot.querySelector("td:not([disabled])");
      if (firstTd instanceof HTMLTableCellElement) firstTd.tabIndex = 0;
    }
  }

  onNextMonthClick() {
    const host = getHost(this);

    const isNextMonthBtn = this.id === "next-month";
    const next = isNextMonthBtn ? host.month + 1 : host.month - 1;

    if (next < 0) host.setAttribute("year", String(host.year - 1));
    else if (next > 11) host.setAttribute("year", String(host.year + 1));

    host.setAttribute("month", String((next + 12) % 12));
  }

  onDateClick(event: PointerEvent) {
    const {target} = event;
    if (!(target instanceof Element)) return;
    if (target.hasAttribute("disabled")) return;
    if (!target.classList.contains("date-cell")) return;

    const host = getHost(this);
    host.setAttribute(
      "date", 
      new Date(host.year, host.month, Number(target.textContent)).toDateString(),
    );
  }

  onYearSelectorClick() {
    const host = getHost(this);
    host.restrictTableHeight(true);

    if (host.view === "dates") {
      host.setAttribute("view", "years");
    } else {
      host.setAttribute("view", "dates");
    }
  }

  onYearTdClick(event: PointerEvent) {
    const {target} = event;
    if (!(target instanceof HTMLTableCellElement)) return;
    if (!target.classList.contains("year-cell")) return;

    const host = getHost(target);

    host.setAttribute("year", target.textContent);
    host.setAttribute("view", "months");
  }

  onMonthTdClick(event: PointerEvent) {
    const {target} = event;
    if (!(target instanceof HTMLTableCellElement)) return;
    if (!target.classList.contains("month-cell")) return;

    const host = getHost(target);

    host.setAttribute("month", String(target.dataset.month));
    host.setAttribute("view", "dates");

    const yearToggler = host.shadowRoot.querySelector("#year-month-toggler");
    if (yearToggler instanceof HTMLButtonElement) {
      queueMicrotask(() => yearToggler.focus());
    }
  }
  
  onTdKeyDown(event: KeyboardEvent) {
    const { target: td, code } = event;
    if (!(td instanceof HTMLTableCellElement)) return;

    // Универсальные ключи
    if (code === "Enter" || code === "Space") {
      event.preventDefault(); // Запретим прокрутку
      td.click();
      return;
    }

    const host = getHost(td);
    if (host.view === "dates") host.handleDatesKeyDown(event, td);
    else host.handleGridViewKeyDown(event, td);
  }

  handleDatesKeyDown(event: KeyboardEvent, td: HTMLTableCellElement) {
    const { code, shiftKey } = event;
    const tr = td.closest("tr");
    assert(tr instanceof HTMLTableRowElement);
    const host = getHost(td);

    switch (code) {
      case "ArrowLeft": {
        event.preventDefault();
        const nextDate = new Date(Number(new Date(String(td.dataset.date))) - msInDay);
        host.moveDateFocus(nextDate, host);
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        const nextDate = new Date(Number(new Date(String(td.dataset.date))) + msInDay);
        host.moveDateFocus(nextDate, host);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const nextDate = new Date(Number(new Date(String(td.dataset.date))) - 7 * msInDay);
        host.moveDateFocus(nextDate, host);
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        const nextDate = new Date(Number(new Date(String(td.dataset.date))) + 7 * msInDay);
        host.moveDateFocus(nextDate, host);
        break;
      }
      case "Home": {
        tr.cells[0].focus();
        break;
      }
      case "End": {
        tr.cells[tr.cells.length - 1].focus();
        break;
      }
      case "PageUp":
      case "PageDown": {
        event.preventDefault();
        const { date } = td.dataset;
        assert(date);

        const dir = code === "PageUp" ? -1 : 1;
        const monthDiff = (shiftKey ? 12 : 1) * dir;

        const dateToFocus = host.addMonthSafely(new Date(date), monthDiff, host.minYear, host.maxYear);
        if (!dateToFocus) return;

        host.setAttribute("year", String(dateToFocus.getFullYear()));
        host.setAttribute("month", String(dateToFocus.getMonth()));

        queueMicrotask(() => {
          const cellToFocus = host.getDateCell(dateToFocus);
          assert(cellToFocus instanceof HTMLTableCellElement);
          cellToFocus.focus();
        });
        break;
      }
    }
  }

  handleGridViewKeyDown(event: KeyboardEvent, td: HTMLTableCellElement) {
    const { code } = event;
    const host = getHost(td);

    switch (code) {
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        host.moveFocusFromTd(td, code as ArrowKey);
        break;
    }
  }

  addMonthSafely(d: Date, delta: number, minYear: number, maxYear:number) {
    const nextPeriodLastDate = new Date(d.getFullYear(), d.getMonth() + delta + 1, 0);
    const nextPeriodFirstDate = new Date(d.getFullYear(), d.getMonth() + delta );
    const dateOfNextPeriod = new Date(d.getFullYear(), d.getMonth() + delta, d.getDate());

    const nextPeriodYear = nextPeriodFirstDate.getFullYear();
    if (nextPeriodYear < minYear || nextPeriodYear > maxYear) return null;

    return new Date(Math.min(+dateOfNextPeriod, +nextPeriodLastDate));
  }

  moveDateFocus(nextDate: Date, host: CustomCalendar) {
    const nextDateYear = nextDate.getFullYear();
    if (nextDateYear < host.minYear || nextDateYear > host.maxYear) return;

    const isNextDateFromOtherMonth = nextDate.getMonth() !== host.month;
    const isNextDateFromOtherYear = nextDate.getFullYear() !== host.year;

    if (isNextDateFromOtherYear) host.setAttribute("year", String(nextDate.getFullYear()));
    if (isNextDateFromOtherMonth) host.setAttribute("month", String(nextDate.getMonth()));

    queueMicrotask(() => {
      const nextTd = host.getDateCell(nextDate);
      assert(nextTd instanceof HTMLTableCellElement);
      nextTd.focus();
    });
  }

  moveFocusFromTd(td: HTMLTableCellElement, code: ArrowKey) {
    const tr = td.closest("tr");
    assert(tr instanceof HTMLTableRowElement);

    const tbody = tr.closest("tbody");
    assert(tbody instanceof HTMLTableSectionElement);

    const {sectionRowIndex} = tr;
    const {cellIndex} = td;

    const maxRowIndex = tbody.rows.length - 1;
    const maxColIndex = tr.cells.length - 1;

    let nextCell: HTMLTableCellElement | undefined;

    if (code === "ArrowDown" && sectionRowIndex < maxRowIndex) {
      nextCell = tbody.rows[sectionRowIndex + 1].cells[cellIndex];
    } 

    if (code === "ArrowUp" && sectionRowIndex > 0) {
      nextCell = tbody.rows[sectionRowIndex - 1].cells[cellIndex];
    } 

    if (code === "ArrowLeft") {
      if (cellIndex > 0) {
        nextCell = tbody.rows[sectionRowIndex].cells[cellIndex - 1];
      } else if (sectionRowIndex > 0) {
        nextCell = tbody.rows[sectionRowIndex - 1].cells[maxColIndex];
      }
    }

    if (code === "ArrowRight") {
      if (cellIndex < maxColIndex) {
        nextCell = tbody.rows[sectionRowIndex].cells[cellIndex + 1];
      } else if (sectionRowIndex < maxRowIndex) {
        nextCell = tbody.rows[sectionRowIndex + 1].cells[0];
      }
    }

    if (nextCell && !nextCell.hasAttribute("disabled")) {
      td.tabIndex = -1;
      nextCell.tabIndex = 0;
      nextCell.focus();
      this.observer.disconnect();
      this.observer.observe(nextCell);
    }
  }

  disableMonthArrowIfNeeded() {
    const {year, month, minYear, maxYear, shadowRoot} = this;

    const prevMonthBtn = shadowRoot.getElementById("prev-month");
    assert(prevMonthBtn instanceof HTMLButtonElement);
    const prevMonthDate = new Date(year, month - 1);
    prevMonthBtn.disabled = prevMonthDate.getFullYear() < minYear;

    const nextMonthBtn = shadowRoot.getElementById("next-month");
    assert(nextMonthBtn instanceof HTMLButtonElement);
    const nextMonthDate = new Date(year, month + 1);
    nextMonthBtn.disabled = nextMonthDate.getFullYear() > maxYear;
  }

  getDateCell(date: Date) {
    return this.shadowRoot.querySelector(`[data-date="${date.toDateString()}"]`);
  }

  formatYearMonth(year: number, month: number) {
    return new Date(year, month).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  restrictTableHeight(shouldBeRestricted: boolean) {
    const tablesContainer = this.shadowRoot.querySelector(".tables-container");
    assert(tablesContainer instanceof HTMLElement);

    const varName = "--table-height";

    if (shouldBeRestricted) {
      const currentHeight = tablesContainer.getBoundingClientRect().height + "px";
      tablesContainer.style.setProperty(varName, currentHeight);
    } else {
      tablesContainer.style.setProperty(varName, "");
    }
  }
}


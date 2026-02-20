import template from "./template.html";
import styles from "./style.css?raw";
import { attachStyles, initCustomElement } from "@/utils/customElementHelpers";
import { assert } from "@/utils/assert";

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

// пока забить на создание дополнительных свойств и синхронизацию их с атрибутами
// пусть будет все проще, чем в custom-autocomplete

// паттерн grid https://www.w3.org/WAI/ARIA/apg/patterns/grid/
export class CustomCalendar extends HTMLElement {
  [key: string]: unknown;
  ["constructor"]!: typeof CustomCalendar;

  shadowRoot!: ShadowRoot;
  skipCb = true;

  constructor() {
    super();
    this.attachShadow({mode: "open"});
  }

  static get observedAttributes() {
    return ["year", "month","date", "view"];
  }

  get view() {
    return this.getAttribute("view") || "dates";
  }

  get year() {
    return Number(this.getAttribute("year") ?? new Date().getFullYear());
  }

  get month() {
    return Number(this.getAttribute("month") ?? new Date().getMonth());
  }

  get date() {
    return this.getAttribute("date");
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = template;
    attachStyles(this, styles);

    this.attachHandlers();

    if (!this.hasAttribute("view")) {
      this.setAttribute("view", "dates");
    }
    this.render("view");
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | boolean,
    newValue: string | boolean,
  ) {
    if (this.skipCb) return;

    this.render(name);
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
  }

  render(attrName: string = "") {
    this.skipCb = true;
    const view = this.view;

    if (view === "dates") {
      if ((attrName === "month" || attrName === "year")) {
        this.renderDates();
      }
      this.renderSelectedDate();
    }

    if (attrName === "view") {
      const tbodies = [...this.shadowRoot.querySelectorAll("tbody")];
      tbodies.forEach(tbody => tbody.innerHTML = "");

      if (view === "years") this.renderYears();
      else if (view === "months") this.renderMonths();
      else if (view === "dates") {
        this.renderDates();
        this.renderSelectedDate();
        this.restrictTableHeight(false);
      }
    }

    this.skipCb = false;
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
    const minYear = 1970; // TODO добавить минимальные года
    const maxYear = 2050;
    const yearsPerRow = 4;
    const maxRows = Math.ceil((maxYear - minYear) / yearsPerRow);
    const tbody = document.createElement("tbody");

    for (let row = 0; row < maxRows; row++) {
      const tr = document.createElement("tr");

      for (let col = 0; col < yearsPerRow; col++) {
        const td = document.createElement("td");
        td.classList.add("year-cell");
        td.textContent = String(minYear + (row * yearsPerRow) + col);
        tr.append(td);
      }

      tbody.append(tr);
    }

    this.shadowRoot.querySelector("#years tbody")?.replaceWith(tbody);
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
        td.dataset.index = String(index);
        td.textContent = new Date(
          new Date().setMonth(index),
        ).toLocaleDateString(undefined, {month: "short"});

        tr.append(td);
      }
      tbody.append(tr);
    }

    this.shadowRoot.querySelector("#months tbody")?.replaceWith(tbody);
  }

  renderSelectedDate() {
    const {shadowRoot} = this;

    const selected = shadowRoot.querySelector(".selected");
    if (selected) selected.classList.remove("selected");

    const selectedDate = this.date;
    if (selectedDate) {
      const cell = shadowRoot.querySelector(`[data-date="${selectedDate}"]`);
      if (cell) cell.classList.add("selected");
    }
  }

  onNextMonthClick() {
    const host = getHost(this);

    const isNextMonthBtn = this.id === "next-month";
    const next = isNextMonthBtn ? host.month + 1 : host.month - 1;

    host.skipCb = true;
    if (next < 0) host.setAttribute("year", String(host.year - 1));
    else if (next > 11) host.setAttribute("year", String(host.year + 1));

    host.setAttribute("month", String((next + 12) % 12));
    host.render("month");
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

    if (host.view !== "dates") {
      host.setAttribute("view", "dates");
    } else {
      host.setAttribute("view", "years");
    }
    // TODO добавить вычисление высоты через переменную
  }

  onYearTdClick(event: PointerEvent) {
    const {target} = event;
    if (!(target instanceof HTMLTableCellElement)) return;
    if (!target.classList.contains("year-cell")) return;

    const host = getHost(target);

    host.skipCb = true;
    host.setAttribute("year", target.textContent);
    host.setAttribute("view", "months");
    host.render("view");
  }

  onMonthTdClick(event: PointerEvent) {
    const {target} = event;
    if (!(target instanceof HTMLTableCellElement)) return;
    if (!target.classList.contains("month-cell")) return;

    const host = getHost(target);

    host.skipCb = true;
    host.setAttribute("month", String(target.dataset.index));
    host.setAttribute("view", "dates");
    host.render("view");
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

initCustomElement("custom-calendar", CustomCalendar);
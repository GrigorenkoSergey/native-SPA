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
// пока забить на создание дополнительных свойств и синхронизацию их с атрибутами
// пусть будет все проще, чем в custom-autocomplete

// паттерн grid https://www.w3.org/WAI/ARIA/apg/patterns/grid/
export class CustomCalendar extends HTMLElement {
  [key: string]: unknown;
  ["constructor"]!: typeof CustomCalendar;

  shadowRoot!: ShadowRoot;
  isInnerAttrSet = false;
  isRendered = false;

  constructor() {
    super();
    this.attachShadow({mode: "open"});
  }

  static get observedAttributes() {
    return ["year", "month","date"];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = template;
    attachStyles(this, styles);

    this.attachHandlers();
    this.render("month");
    this.isRendered = true;
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | boolean,
    newValue: string | boolean,
  ) {
    if (!this._isRendered) return;
    if (this._isInnerAttrSet) return;

    this.render(name);
  }


  attachHandlers() {
    this.shadowRoot.addEventListener("click", this.onNextMonthClick as EventListener);
  }

  render(attrName: string = "") {
    this.isInnerAttrSet = true;
    if (attrName === "month" || attrName === "year") {
      this.renderNewMonth();
    }
    this.isInnerAttrSet = false;
  }

  get year() {
    return Number(this.getAttribute("year") ?? new Date().getFullYear());
  }

  get month() {
    return Number(this.getAttribute("month") ?? new Date().getMonth());
  }

  renderNewMonth() {
    const visibledDates = monthDates(new Date(this.year, this.month).toString());
    const weeksInMonth = visibledDates.length / 7;

    let ptr = 0;
    const tbody = document.createElement("tbody");

    for (let week = 0; week < weeksInMonth; week++) {
      const tr = document.createElement("tr");

      for (let day = 0; day < 7; day++) {
        const pointedDate = visibledDates[ptr];

        const td = document.createElement("td");
        td.dataset.date = pointedDate.toDateString();
        td.textContent = String(pointedDate.getDate());

        tr.append(td);
        ptr += 1;
      }

      tbody.append(tr);
    }

    const oldTbody = this.shadowRoot.querySelector("tbody");
    assert(oldTbody);
    oldTbody.replaceWith(tbody);

    const h2 = this.shadowRoot.querySelector(".month-year");
    if (h2) h2.textContent = this.formatYearMonth(this.year, this.month);
  }

  onNextMonthClick(event: MouseEvent) {
    const { target } = event;
    if (!(target instanceof Element)) return;

    const isNextMonthBtn = target.closest(".next-month");
    const isPrevMonthBtn = target.closest(".prev-month");
    if (!isNextMonthBtn && !isPrevMonthBtn) return;

    const {host} = this;
    assert(host instanceof CustomCalendar);

    const next = isNextMonthBtn ? host.month + 1 : host.month - 1;
    if (next < 0) host.setAttribute("year", String(host.year - 1));
    else if (next > 11) host.setAttribute("year", String(host.year + 1));
    host.setAttribute("month", String((next + 12) % 12));

    host.render("month");
  }

  formatYearMonth(year: number, month: number) {
    return new Date(year, month).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }
}

initCustomElement("custom-calendar", CustomCalendar);
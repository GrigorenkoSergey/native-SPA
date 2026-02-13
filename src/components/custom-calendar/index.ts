import template from "./template.html";
import styles from "./style.css?raw";
import { attachStyles, initCustomElement } from "@/utils/customElementHelpers";
import { assert } from "@/utils/assert";

// паттерн grid https://www.w3.org/WAI/ARIA/apg/patterns/grid/
export class CustomCalendar extends HTMLElement {
  [key: string]: unknown;
  ["constructor"]!: typeof CustomCalendar;

  constructor() {
    super();
    this.attachShadow({mode: "open"});
  }

  connectedCallback() {
    assert(this.shadowRoot);
    this.shadowRoot.innerHTML = template;
    attachStyles(this, styles);
  }
}

initCustomElement("custom-calendar", CustomCalendar);
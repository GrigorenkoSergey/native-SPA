import template from "./template.html";
import styles from "./style.css?raw";

import { attachStyles, initCustomElement } from "@/utils/customElementHelpers";
import { assert } from "@/utils/assert";

class MainNav extends HTMLElement {
  [key: string]: unknown;
  ["constructor"]!: typeof MainNav;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    assert(this.shadowRoot);
    this.shadowRoot.innerHTML = template;
    attachStyles(this, styles);

    const currentPathname = window.location.pathname;

    const links = this.shadowRoot.querySelectorAll("[data-inner-link]");
    links.forEach(link => {
      assert(link instanceof HTMLAnchorElement);

      const linkPathname = new URL(link.href).pathname;

      if (currentPathname === linkPathname) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }
}

initCustomElement("main-nav", MainNav);

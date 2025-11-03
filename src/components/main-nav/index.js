import template from "./template.html";
import styles from "./style.css?raw";

import { attachStyles, initCustomElement } from "@/utils/customElementHelpers";

class MainNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = template;
    attachStyles(this, styles);

    const currentPathname = window.location.pathname;

    const links = this.shadowRoot.querySelectorAll("[data-inner-link]");
    links.forEach(link => {
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

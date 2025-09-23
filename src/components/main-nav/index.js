import template from "./template.html";
import "./style.css";

import { initCustomElement } from "@/utils/customElementHelpers";

class MainNav extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = template;
    const currentPathname = window.location.pathname;

    const links = this.querySelectorAll("[data-inner-link]");
    links.forEach(link => {
      const linkPathname = new URL(link.href).pathname;

      if (currentPathname === linkPathname) {
        link.classList.add("main-nave__a--active");
      } else {
        link.classList.remove("main-nave__a--active");
      }
    });
  }
}

initCustomElement("main-nav", MainNav);

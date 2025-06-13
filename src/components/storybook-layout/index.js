import "/reset.css";
import "./style.css";
import template from "./template.html?raw";

class StorybookLayout extends HTMLElement {
  connectedCallback() {
    const children = [...this.children];
    this.innerHTML = template;
    this.querySelector("main").append(...children);
  }
}

customElements.define("storybook-layout", StorybookLayout);

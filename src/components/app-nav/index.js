import template from "./template.html?raw";
import "./style.css";

class AppNav extends HTMLElement {
  connectedCallback() {
    this.innerHTML = template;
  }
}

customElements.define("app-nav", AppNav);

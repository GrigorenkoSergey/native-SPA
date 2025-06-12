import "./style.css";
import template from "./template.html?raw";

class MyApp extends HTMLElement {
  static get observedAttributes() {
    return ["vite-logo", "js-logo"];
  }

  connectedCallback() {
    const children = [...this.children];
    this.innerHTML = template;
    this.querySelector(".card").append(...children);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue) return;

    if (name === "vite-logo") this.querySelector(".logo").src = newValue;
    if (name === "js-logo") this.querySelector(".vanilla").src = newValue;
  }
}

customElements.define("my-app", MyApp);

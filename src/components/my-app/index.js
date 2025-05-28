
import './style.css'
import template from "./template.html?raw";

class MyApp extends HTMLElement {
  connectedCallback() {
    const viteLogo = this.getAttribute("vite-logo");
    const jsLogo = this.getAttribute("js-logo");

    const children = [...this.children];
    this.innerHTML = template;

    this.querySelector(".logo").src = viteLogo;
    this.querySelector(".vanilla").src = jsLogo;
    this.querySelector(".card").append(...children);
  }
}

customElements.define("my-app", MyApp)
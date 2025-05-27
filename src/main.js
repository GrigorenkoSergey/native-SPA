import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import template from "./template.html?raw";
import "./components/button-with-counter"

class MyApp extends HTMLElement {
  connectedCallback() {
    const { viteLogo, jsLogo } = this.dataset;

    this.innerHTML = template;

    this.querySelector(".logo").src = viteLogo;
    this.querySelector(".vanilla").src = jsLogo;
  }
}

customElements.define("my-app", MyApp)

document.querySelector('#app').innerHTML = `
  <my-app
    data-vite-logo=${viteLogo} 
    data-js-logo=${javascriptLogo}>
  </my-app>`;

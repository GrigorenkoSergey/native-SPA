import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'
import template from "./template.html?raw";

class MyApp extends HTMLElement {
  connectedCallback() {
    const { viteLogo, jsLogo } = this.dataset;
    console.log("viteLogo", viteLogo);
    console.log("jsLogo", jsLogo);

    this.innerHTML = template;
  }
}
// document.querySelector('#app').innerHTML = `
//   <div>
//     <a href="https://vite.dev" target="_blank">
//       <img src="${viteLogo}" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
//       <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
//     </a>
//     <h1>Hello Vite!</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite logo to learn more
//     </p>
//   </div>
// `

customElements.define("my-app", MyApp)

document.querySelector('#app').innerHTML = `
  <my-app
    data-vite-logo=${viteLogo} 
    data-js-logo=${javascriptLogo}>
  </my-app>`;

// setupCounter(document.querySelector('#counter'))

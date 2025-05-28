import "./style.css";
import template from './template.html?raw';

class ButtonWithCounter extends HTMLElement {
  constructor() {
    super();
    this.counter = 0;
  }

  connectedCallback() {
    this.innerHTML = template;

    this.counterContainer = this.querySelector(".counter");

    this.updateCounter(0);
    this.querySelector("button").addEventListener('click', () => this.updateCounter(1))
  }

  updateCounter(diff) {
    this.counter += diff;
    this.counterContainer.textContent = this.counter;
  }
}

customElements.define("button-with-counter", ButtonWithCounter);

export { ButtonWithCounter };
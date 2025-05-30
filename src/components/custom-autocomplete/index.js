import "./style.css";
import template from "./template.html?raw";

import { listenClickOutsideOnce } from "../../utils/listenClickOutsideOnce";

class CustomAutocomplete extends HTMLElement {
  constructor() {
    super();
    this.options = [];
  }

  connectedCallback() {
    this.innerHTML = template;
    this.input = this.querySelector("input");

    this.addEventListener("click", this.handleClick.bind(this));
    this.input.addEventListener("input", this.handleInput.bind(this));

    this.render();
  }

  handleClick(event) {
    this.classList.add("expanded");
    listenClickOutsideOnce(this, (element) => element.classList.remove("expanded"));

    const { target } = event;
    if (target.tagName === "LI") {
      this.input.value = target.textContent;
    }
  }

  handleInput(event) {
    const input = event.target.value;
    const lis = this.querySelectorAll("li");

    lis.forEach(item => {
      const isMatch = item.textContent.includes(input);

      if (isMatch) item.style.display = "";
      else item.style.display = "none";
    })
  }

  render() {
    this.input.value = "";
    const lis = this.options.map((item) => `<li data-value=${item.value}>${item.label}</li>`);
    const ul = this.querySelector("ul");
    ul.replaceChildren([])
    ul.insertAdjacentHTML("afterbegin", lis.join(""));
  }

  setOptions(options) {
    this.options = options;
    this.render();
  }
}

customElements.define("custom-autocomplete", CustomAutocomplete)
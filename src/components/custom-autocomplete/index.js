import "./style.css";
import template from "./template.html?raw";

import { listenClickOutsideOnce } from "../../utils/listenClickOutsideOnce";

class CustomAutocomplete extends HTMLElement {
  connectedCallback() {
    this.innerHTML = template;
    this.input = this.querySelector("input");

    this.addEventListener("click", this.handleClick);
  }

  handleClick(event) {
    const { target } = event;
    this.classList.add("expanded");

    listenClickOutsideOnce(this, (element) => element.classList.remove("expanded"));

    if (target.tagName === "LI") {
      this.input.value = target.textContent;
    }
  }
}

customElements.define("custom-autocomplete", CustomAutocomplete)
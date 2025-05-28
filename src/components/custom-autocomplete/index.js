import "./style.css";
import template from "./template.html?raw";

class CustomAutocomplete extends HTMLElement {
  connectedCallback() {
    this.innerHTML = template;
  }
}

customElements.define("custom-autocomplete", CustomAutocomplete)
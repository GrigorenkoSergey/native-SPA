import "./style.css";
import template from "./template.html?raw";

import { listenClickOutsideOnce } from "../../utils/listenClickOutsideOnce";

const ulClasses = {
  expanded: "expanded",
};

const liClasses = {
  keyboardFocused: "keyboard-focused",
};

class CustomAutocomplete extends HTMLElement {
  constructor() {
    super();
    this.options = [];
    this.isOpen = false;
    this.value = "";
    this.isEditing = false;
  }

  connectedCallback() {
    this.innerHTML = template;
    this.input = this.querySelector("input");
    this.ul = this.querySelector("ul");

    // предпочтительно через свойство, чтобы не очищать лишний раз обработчики
    this.onclick = event => this.handleClick(event);
    this.input.oninput = event => this.handleInput(event);
    this.onkeydown = event => this.handleKeydown(event);

    this.init();
  }

  renderLi(item) {
    return `<li data-value=${item}>${item}</li>`;
  }

  init() {
    this.input.value = "";
    const lis = this.options.map(item => this.renderLi(item));

    this.ul.replaceChildren([]);
    this.ul.insertAdjacentHTML("afterbegin", lis.join(""));
  }

  setOptions(options) {
    this.options = options;
    this.init();
  }

  handleClick(event) {
    this.isOpen = true;

    listenClickOutsideOnce(this, () => {
      this.isOpen = false;
      this.isEditing = false;
      if (this.input.value === "") this.value = "";

      this.render();
    });

    const { target } = event;
    if (target.tagName === "LI") {
      this.value = target.dataset.value;
      this.isOpen = false;
    }

    this.render();
  }

  handleInput() {
    this.isEditing = true;
    this.render();
    this.isEditing = false;
  }

  handleKeydown(event) {
    this.isOpen = true;

    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      return this.handleArrowKeydown(event);
    }

    if (key === "Enter") {
      const currentPointed = this._getCurrentPointedElement();
      if (!currentPointed) return;

      this.value = currentPointed.dataset.value;
      this.isOpen = false;
      return this.render();
    }
  }

  handleArrowKeydown(event) {
    event.preventDefault(); // чтобы курсор не двигался

    const { key } = event;
    const startPoint = this._getCurrentPointedElement();
    const ul = this.ul;

    let elementToHighlight;

    if (key === "ArrowDown") {
      if (!startPoint) elementToHighlight = ul.firstElementChild;
      else if (startPoint === ul.lastElementChild) elementToHighlight = ul.lastElementChild;
      else elementToHighlight = startPoint.nextElementSibling;
    }

    if (key === "ArrowUp") {
      if (!startPoint) elementToHighlight = ul.lastElementChild;
      else if (startPoint === ul.firstElementChild) elementToHighlight = ul.firstElementChild;
      else elementToHighlight = startPoint.previousElementSibling;
    }

    this.keyboardSelected = elementToHighlight;
    this.render();
    this.keyboardSelected = undefined;

    this.addEventListener("pointermove", this.handlePointerMove.bind(this), { once: true });
  }

  handlePointerMove() {
    this.keyboardSelected = undefined;
    this.render();
  }

  render() {
    const { value } = this;
    if (!this.isEditing) this.input.value = value;

    if (this.isOpen) this.classList.add(ulClasses.expanded);
    else this.classList.remove(ulClasses.expanded);

    const lis = Array.from(this.ul.querySelectorAll("li") || []);

    lis.forEach(li => {
      this._visualizeSelected(li, value);
      this._visualizeKeyboardSelected(li);
      this._filterOnInput(li);
    });
  }

  _getCurrentPointedElement() {
    const { ul } = this;

    return (
      ul.querySelector("." + liClasses.keyboardFocused) ||
      ul.querySelector("li:hover") ||
      ul.querySelector(`[data-value='${this.input.value}']`)
    );
  }

  _visualizeSelected(li, value) {
    if (li.dataset.value === value) li.classList.add("selected");
    else li.classList.remove("selected");
  }

  _visualizeKeyboardSelected(li) {
    if (this.keyboardSelected === li) li.classList.add(liClasses.keyboardFocused);
    else li.classList.remove(liClasses.keyboardFocused);
  }

  _filterOnInput(li) {
    if (!this.isEditing) li.style.display = "";
    else {
      const inputValue = this.input.value.toLowerCase();
      const isMatch = li.textContent.toLowerCase().includes(inputValue);
      if (isMatch) li.style.display = "";
      else li.style.display = "none";
    }
  }
}

// TODO поэкспериментировать с видимостью методов элемента,
// возможно вынести служеные функции наверх, или переопределить свойства элемента.

// TODO добавить сверху описание поля (legend)
// TODO добавить стрелочку и крестик

customElements.define("custom-autocomplete", CustomAutocomplete);

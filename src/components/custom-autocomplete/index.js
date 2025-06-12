import "./style.css";
import template from "./template.html?raw";

import { listenClickOutsideOnce } from "../../utils/listenClickOutsideOnce";

const liClasses = {
  keyboardFocused: "keyboard-focused",
};

const removeKeyBoardFocusedClass = ctx => {
  const lis = Array.from(ctx.ul.querySelectorAll("li") || []);
  lis.forEach(item => item.classList.remove(liClasses.keyboardFocused));
};

class CustomAutocomplete extends HTMLElement {
  constructor() {
    super();
    this.options = [];
    this.isOpen = false;
    this.value = "";
    this.listenersWereAdded = false;
    this.isEditing = false;
  }

  connectedCallback() {
    this.innerHTML = template;
    this.input = this.querySelector("input");
    this.ul = this.querySelector("ul");

    if (!this.listenersWereAdded) {
      this.addEventListener("click", this.handleClick.bind(this));
      this.input.addEventListener("input", this.handleInput.bind(this));
      this.addEventListener("keydown", this.handleKeydown.bind(this));
      // this.addEventListener("pointermove", this.handlePointerMove.bind(this));
    }

    this.listenersWereAdded = true;
    this.init();
  }

  init() {
    this.input.value = "";
    // TODO а если понадобятся более сложные списки, с иконками, например?
    const lis = this.options.map(item => `<li data-value=${item.value}>${item.label}</li>`);

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
    if (target.tagName === "LI") this.value = target.dataset.value;

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

    // if (key === "Enter") {
    //   const currentFocused = getKeyboardSelected(this);
    //   if (currentFocused) this.selectItem(currentFocused);
    // }
  }

  handleArrowKeydown(event) {
    const { key } = event;
    const ul = this.ul;

    const startPoint =
      ul.querySelector("." + liClasses.keyboardFocused) ||
      ul.querySelector("li:hover") ||
      ul.querySelector(`[data-value='${this.input.value}']`);

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
  }

  handlePointerMove() {
    removeKeyBoardFocusedClass(this);
  }

  render() {
    const { value } = this;
    if (!this.isEditing) this.input.value = value;

    if (this.isOpen) this.classList.add("expanded");
    else this.classList.remove("expanded");

    const lis = Array.from(this.ul.querySelectorAll("li") || []);

    lis.forEach(li => {
      this._visualizeSelected(li, value);
      this._visualizeKeyboardSelected(li);
      this._filterOnInput(li);
    });
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
      const inputValue = this.input.value;
      const isMatch = li.textContent.includes(inputValue);
      if (isMatch) li.style.display = "";
      else li.style.display = "none";
    }
  }
}

customElements.define("custom-autocomplete", CustomAutocomplete);

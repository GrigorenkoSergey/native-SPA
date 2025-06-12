import "./style.css";
import template from "./template.html?raw";

import { listenClickOutsideOnce } from "../../utils/listenClickOutsideOnce";

const liClasses = {
  keyboardFocused: "keyboard-focused",
};

const getKeyboardSelected = ctx => ctx.querySelector("." + liClasses.keyboardFocused);

const removeKeyBoardFocusedClass = ctx => {
  const lis = Array.from(ctx.ul.querySelectorAll("li") || []);
  lis.forEach(item => item.classList.remove(liClasses.keyboardFocused));
};

class CustomAutocomplete extends HTMLElement {
  constructor() {
    super();
    this.isOpen = false;
    this.options = [];
    this.listenersWereAdded = false;
  }

  connectedCallback() {
    this.innerHTML = template;
    this.input = this.querySelector("input");
    this.ul = this.querySelector("ul");
    this.value = "";

    if (!this.listenersWereAdded) {
      this.addEventListener("click", this.handleClick.bind(this));
      // this.input.addEventListener("input", this.handleInput.bind(this));
      // this.addEventListener("keydown", this.handleKeydown.bind(this));
      // this.addEventListener("pointermove", this.handlePointerMove.bind(this));
    }

    this.listenersWereAdded = true;
    this.init();
  }

  handleClick(event) {
    this.isOpen = true;

    listenClickOutsideOnce(this, () => {
      this.isOpen = false;
      this.render();
    });

    const { target } = event;
    if (target.tagName === "LI") this.value = target.dataset.value;

    this.render();
  }

  selectItem(item) {
    this.input.value = item.textContent;
    this.classList.remove("expanded");
  }

  handleKeydown(event) {
    this.classList.add("expanded");

    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      return this.handleArrowKeydown(event);
    }

    if (key === "Enter") {
      const currentFocused = getKeyboardSelected(this);
      if (currentFocused) this.selectItem(currentFocused);
    }
  }

  handleArrowKeydown(event) {
    const { key } = event;
    const ul = this.ul;

    const startPoint =
      ul.querySelector("." + liClasses.keyboardFocused) ||
      ul.querySelector("li:hover") ||
      ul.querySelector(`[data-value='${this.input.value}']`);

    removeKeyBoardFocusedClass(this);

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

    elementToHighlight.classList.add(liClasses.keyboardFocused);
  }

  handlePointerMove() {
    removeKeyBoardFocusedClass(this);
  }

  handleInput(event) {
    const input = event.target.value;
    const lis = this.querySelectorAll("li");

    lis.forEach(item => {
      const isMatch = item.textContent.includes(input);

      if (isMatch) item.style.display = "";
      else item.style.display = "none";
    });
  }

  render() {
    const { isOpen, value, ul } = this;
    this.input.value = value;

    if (isOpen) this.classList.add("expanded");
    else this.classList.remove("expanded");

    const lis = Array.from(ul.querySelectorAll("li") || []);
    lis.forEach(li => {
      if (li.dataset.value === value) li.classList.add("selected");
      else li.classList.remove("selected");
    });
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
}

customElements.define("custom-autocomplete", CustomAutocomplete);

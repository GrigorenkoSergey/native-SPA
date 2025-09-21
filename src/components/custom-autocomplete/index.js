import template from "./template.html";
import "./style.css";

import { listenClickOutsideOnce } from "@/utils/listenClickOutsideOnce.js";
import { generateIdInDocument } from "@/utils/generateIdInDocument.js";
import {
  syncAttrsPropsState,
  initCustomElement,
  applyGetSet,
  syncPropsWithAttrs,
} from "@/utils/customElementHelpers.js";

// TODO добавить рестик
// TODO добавить видимость выбранного элемента в случае длинных списков (возможно, прокрутка к нему)
/*
  TODO посмотреть, как можно добавить настройку слотов. Через светлый DOM или через теневой. 
  К примеру, через светлый DOM можно добавить свойство, которое ищет по id определенный шаблон, в котором
  реализованы нужные элементы (например, стрелка или значок очистки). И при его наличии меняет стандартную реализацию... 
  Если буду дальше использовать теневой DOM, то там уже есть слоты... 

  В общем, подумать.
*/

const liClasses = {
  keyboardFocused: "keyboard-focused",
};

const events = {
  change: "custom-autocomplete__change",
};

class CustomAutocomplete extends HTMLElement {
  _isInnerAttrSet = false;
  _isRendered = false;

  constructor() {
    super();

    // properties that will be synchronized with attributes
    this.open = this.hasAttribute("open");
    this.value = this.getAttribute("value") || "";
    applyGetSet(this, "open", "value");

    this.events = events;
    Object.defineProperty(this, "events", { writable: false });

    this._state = {
      open: this.open,
      value: this.value,
      options: [],
      isEditing: false,
    };

    this._nodes = {
      input: null,
      ul: null,
      selected: null,
      activeDescendant: null,
    };
  }

  static get observedAttributes() {
    return ["value", "open"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._isRendered) return;
    if (this._isInnerAttrSet) return;

    syncPropsWithAttrs(this, name, newValue);

    return this.render(name, newValue);
  }

  connectedCallback() {
    if (this.hasAttribute("prerendered")) {
      const options = [...this.querySelectorAll("li")].map(item => item.getAttribute("data-value"));
      this._state.options = options;
    } else {
      this.innerHTML = template;
    }

    this.setAttribute("role", "combobox");
    this.setAttribute("aria-haspopup", "listbox");

    const input = this.querySelector("input");

    let name = this.getAttribute("name");
    if (!name) throw new Error("Custom-autocomplete: attribute 'name' is required!");
    input.setAttribute("name", name);
    this._nodes.input = input;

    const ul = this.querySelector("ul");
    this._nodes.ul = ul;

    const ulId = generateIdInDocument("custom-autocomplete");
    ul.setAttribute("id", ulId);
    this.setAttribute("aria-controls", ulId);

    this._nodes.selected = this.value ? ul.querySelector(`[data-value='${this.value}']`) : undefined;

    // preferably through a property, so as not to clear the handlers once again
    this.onclick = event => this._onClick(event);
    input.oninput = event => this._onInput(event);
    input.addEventListener("click", this._onInputClick);
    this.onkeydown = event => this._onKeydown(event);

    this._init();
    this._isRendered = true;
  }

  setOptions(options) {
    this._state.options = options;
    this._init();
  }

  renderLi(item, index) {
    return (
      `<li id='custom-autocomplete-option-${index}'` +
      "class='custom-autocomplete__li' " +
      `data-value='${item}' role='option'>` +
      item +
      "</li>"
    );
  }

  render(attrName) {
    syncAttrsPropsState(this, attrName);

    const { _state, _nodes } = this;
    const { value, open } = _state;
    if (!_state.isEditing) _nodes.input.value = value;
    this.ariaExpanded = String(open);

    document.removeEventListener("focus", this._onOuterElementFocus, true);
    if (!open) return;

    document.addEventListener("focus", this._onOuterElementFocus, true);

    const attr = "aria-activedescendant";
    if (_nodes.activeDescendant) {
      _nodes.input.setAttribute(attr, _nodes.activeDescendant.id);
    } else {
      _nodes.input.removeAttribute(attr);
    }

    const lis = _nodes.ul.querySelectorAll("li");
    for (const li of lis) {
      this._visualizeSelected(li, value);
      this._visualizeKeyboardSelected(li);
      this._filterOnInput(li);
    }
  }

  _init() {
    const { ul, input } = this._nodes;
    const { options, value } = this._state;
    input.value = value;

    if (!this.hasAttribute("prerendered")) {
      ul.replaceChildren([]); // there the list element is given as an example, so we delete it

      const lis = options.map((item, index) => this.renderLi(item, index));
      ul.insertAdjacentHTML("afterbegin", lis.join(""));
    }

    this.render();
  }

  _onClick(event) {
    const { _state, _nodes } = this;

    if (_state.open) {
      listenClickOutsideOnce(this, () => {
        if (!_state.open) return;

        _state.open = false;
        _state.isEditing = false;
        if (_nodes.input.value === "") _state.value = "";
        this.render();
      });
    }

    const { target } = event;
    if (target.tagName === "LI") {
      _state.value = target.getAttribute("data-value");
      _nodes.selected = target;
      _state.open = false;
      this.render();
    }
  }

  _onInputClick = () => {
    const { _state } = this;
    _state.open = !_state.open;
    this.render();
  };

  _onInput = () => {
    const { _state, _nodes } = this;
    _state.isEditing = true;

    if (!_nodes.input.value) {
      _nodes.selected = null;
      _state.value = "";
    }

    this.render();
    _nodes.input.onblur = () => {
      _state.isEditing = false;
    };
  };

  _onKeydown(event) {
    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      return this._onArrowKeydown(event);
    }

    const { _state } = this;
    if (key === "Enter") {
      const currentPointed = this._getCurrentPointedElement();
      if (!currentPointed) return;

      _state.value = currentPointed.dataset.value;
      _state.selected = currentPointed;
      _state.open = false;
      _state.isEditing = false;

      return this.render();
    }

    if (key === "Escape") {
      const wasOpen = _state.open;
      _state.open = false;
      return wasOpen && this.render();
    }
  }

  _onArrowKeydown(event) {
    event.preventDefault(); // чтобы курсор не двигался

    const { _nodes, _state } = this;
    if (!_state.open) {
      _state.open = true;
      return this.render();
    }

    const startPoint = this._getCurrentPointedElement();
    const ul = _nodes.ul;

    let firstVisible = ul.firstElementChild;
    while (firstVisible && firstVisible.hidden) {
      firstVisible = firstVisible.nextElementSibling;
    }

    let lastVisible = ul.lastElementChild;
    while (lastVisible && lastVisible.hidden) {
      lastVisible = lastVisible.previousElementSibling;
    }

    let elementToHighlight = startPoint;

    const { key } = event;
    if (key === "ArrowDown") {
      if (!startPoint) elementToHighlight = firstVisible;
      else if (startPoint === lastVisible) elementToHighlight = lastVisible;
      else {
        let elem = startPoint.nextElementSibling;
        while (elem && elem.hidden) elem = elem.nextElementSibling;
        elementToHighlight = elem;
      }
    }

    if (key === "ArrowUp") {
      if (!startPoint) elementToHighlight = lastVisible;
      else if (startPoint === firstVisible) elementToHighlight = firstVisible;
      else {
        let elem = startPoint.previousElementSibling;
        while (elem && elem.hidden) elem = elem.previousElementSibling;
        elementToHighlight = elem;
      }
    }

    _nodes.activeDescendant = elementToHighlight;
    this.render();

    this.addEventListener("pointermove", this._onPointerMove, { once: true });
  }

  _onPointerMove() {
    this._nodes.activeDescendant = undefined;
    this.render();
  }

  _onOuterElementFocus = event => {
    if (!this.contains(event.target)) {
      this._state.open = false;
      this.render();
    }
  };

  _getCurrentPointedElement() {
    const { _nodes } = this;
    const { activeDescendant, ul, selected } = _nodes;

    return activeDescendant || ul.querySelector("li:hover") || selected;
  }

  _visualizeSelected(li, value) {
    const attr = "aria-selected";
    if (li.dataset.value === value) li.setAttribute(attr, "true");
    else li.removeAttribute(attr);
  }

  _visualizeKeyboardSelected(li) {
    if (this._nodes.activeDescendant === li) li.classList.add(liClasses.keyboardFocused);
    else li.classList.remove(liClasses.keyboardFocused);
  }

  _filterOnInput(li) {
    if (!this._state.isEditing) li.hidden = false;
    else {
      const inputValue = this._nodes.input.value.toLowerCase();
      const isMatch = li.textContent.toLowerCase().includes(inputValue);
      if (isMatch) li.hidden = false;
      else li.hidden = true;
    }
  }
}

initCustomElement("custom-autocomplete", CustomAutocomplete);

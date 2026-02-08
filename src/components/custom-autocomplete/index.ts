import template from "./template.html";
import styles from "./style.css?raw";

import { listenClickOutsideOnce } from "@/utils/listenClickOutsideOnce";
import { generateIdInDocument } from "@/utils/generateIdInDocument";
import { assert } from "@/utils/assert";
import {
  syncAttrPropsWithState,
  initCustomElement,
  applyGetSet,
  syncPropsWithAttrs,
  attachStyles,
  findById,
  replaceToCustomIds,
} from "@/utils/customElementHelpers";

// TODO добавить крестик
// TODO добавить видимость выбранного элемента в случае длинных списков (возможно, прокрутка к нему)
const liClasses = {
  keyboardFocused: "keyboard-focused",
};

const events = {
  change: "custom-autocomplete__change" as const,
};

export interface CEvent extends CustomEvent {
  detail: {
    oldValue: string | boolean;
    newValue: string | boolean;
    attribute: string;
    source: "user" | "program";
  }
}


export class CustomAutocomplete extends HTMLElement {
  _isInnerAttrSet = false;
  _isRendered = false;
  _state;
  _nodes;
  open;
  value;
  events;
  shadowRoot!: ShadowRoot;

  [key: string]: unknown;
  ["constructor"]!: typeof CustomAutocomplete;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    // properties that will be synchronized with attributes
    this.open = this.hasAttribute("open");
    this.value = this.getAttribute("value") || "";
    applyGetSet(this, "open", "value");

    this.events = events;
    Object.defineProperty(this, "events", { writable: false });

    this._state = {
      open: this.open,
      value: this.value,
      options: [] as unknown[],
      isEditing: false,
      selected: null as null | Element,
    };

    this._nodes = {
      input: null as null | HTMLInputElement,
      ul: null as null | HTMLUListElement,
      selected: null as null | Element,
      activeDescendant: null as null | Element,
    };
  }

  static get observedAttributes() {
    return ["value", "open"];
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | boolean,
    newValue: string | boolean,
  ) {
    if (!this._isRendered) return;

    if (oldValue !== newValue) {
      this.dispatchEvent(
        new CustomEvent(events.change, {
          bubbles: true,
          composed: true,
          detail: {
            oldValue,
            newValue,
            attribute: name,
            source: this._isInnerAttrSet ? "user" : "program",
          },
        }),
      );
    }

    if (this._isInnerAttrSet) return;

    syncPropsWithAttrs(this, name, newValue);
    this.render(name);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = template;

    const templateAttr = this.getAttribute("template");
    const customTemplate = templateAttr && findById(templateAttr, this);

    if (customTemplate instanceof HTMLTemplateElement) {
      attachStyles(this, styles, customTemplate);
      replaceToCustomIds(this.shadowRoot, customTemplate);
    } else {
      attachStyles(this, styles, null);
    }

    this.setAttribute("role", "combobox");
    this.setAttribute("aria-haspopup", "listbox");

    const input = this.shadowRoot.querySelector("input");

    const name = this.getAttribute("name");
    if (!name) throw new Error("Custom-autocomplete: attribute 'name' is required!");
    input?.setAttribute("name", name);

    this._nodes.input = input;

    const ul = this.shadowRoot.querySelector("ul");
    this._nodes.ul = ul;

    const ulId = generateIdInDocument("custom-autocomplete");
    ul?.setAttribute("id", ulId);
    this.setAttribute("aria-controls", ulId);

    this._nodes.selected = (this.value && ul) ? ul.querySelector(`[data-value='${this.value}']`) : null;

    this._init();
    this._attachHandlers();
    this._isRendered = true;
  }

  setOptions(options: unknown[]) {
    this._state.options = options;
    this._init();
  }

  renderLi(item: unknown, index: number) {
    return `<li part="li" id='option-${index}' data-value='${item}' role='option'>${item}</li>`;
  }

  // calling with the attribute name will mean that the render is initiated from attributeChangeCallback
  render(attrName: string = "") {
    syncAttrPropsWithState(this, attrName);

    const { _state, _nodes } = this;
    const { value, open } = _state;
    if (!_state.isEditing && _nodes.input) _nodes.input.value = value;
    this.ariaExpanded = String(open);

    document.removeEventListener("focus", this._onOuterElementFocus, true);

    if (!open) return;

    document.addEventListener("focus", this._onOuterElementFocus, true);

    const attr = "aria-activedescendant";
    if (_nodes.activeDescendant) {
      _nodes.input?.setAttribute(attr, _nodes.activeDescendant.id);
    } else {
      _nodes.input?.removeAttribute(attr);
    }

    const lis = Array.from(_nodes.ul?.querySelectorAll("li") || []);

    for (const li of lis) {
      this._visualizeSelected(li, value);
      this._visualizeKeyboardSelected(li);
      this._filterOnInput(li);
    }
  }

  _init() {
    const { ul, input } = this._nodes;
    const { options, value } = this._state;
    if (input) input.value = value;

    if (ul) ul.replaceChildren(); // there the list element is given as an example, so we delete it

    const lis = options.map((item, index) => this.renderLi(item, index));
    ul?.insertAdjacentHTML("afterbegin", lis.join(""));

    this.render();
  }

  _attachHandlers() {
    // Note that here, since all clicks are on the shadow root, the order of processing is important. And does not depend on ascent
    this.shadowRoot.addEventListener("click", this._onInputClick as EventListener);
    this.shadowRoot.addEventListener("click", this._onClick as EventListener);
    this.shadowRoot.addEventListener("keydown", this._onKeydown as EventListener);
    this.shadowRoot.addEventListener("input", this._onInput);
  }

  _onClick(event: MouseEvent) {
    const { host } = this.getRootNode() as ShadowRoot;
    assert(host instanceof CustomAutocomplete);

    const { _state, _nodes } = host;

    if (_state.open) {
      listenClickOutsideOnce(host, () => {
        if (!_state.open) return;

        _state.open = false;
        _state.isEditing = false;
        if (_nodes.input?.value === "") _state.value = "";
        host.render();
      });
    }

    const { target } = event;
    assert(target instanceof HTMLElement);

    if (target.tagName === "LI") {
      _state.value = target.getAttribute("data-value") || "";
      _nodes.selected = target;
      _state.open = false;
      host.render();
    }
  }

  _onInputClick(event: MouseEvent) {
    const { host } = this.getRootNode() as ShadowRoot;
    assert(host instanceof CustomAutocomplete);

    if (event.target !== host._nodes.input) return;

    const { _state } = host;
    _state.open = !_state.open;
    host.render();
  }

  _onInput() {
    const { host } = this.getRootNode() as ShadowRoot;
    assert(host instanceof CustomAutocomplete);

    const { _state, _nodes } = host;
    _state.isEditing = true;

    if (!_nodes.input?.value) {
      _nodes.selected = null;
      _state.value = "";
    }

    host.render();

    assert(_nodes.input);
    _nodes.input.onblur = () => {
      _state.isEditing = false;
    };
  }


  _onKeydown(event: KeyboardEvent) {
    const { host } = this.getRootNode() as ShadowRoot;
    assert(host instanceof CustomAutocomplete);

    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      return host._onArrowKeydown(event);
    }

    const { _state } = host;
    if (key === "Enter") {
      const currentPointed = host._getCurrentPointedElement();
      if (!currentPointed) return;

      assert(currentPointed instanceof HTMLElement);

      _state.value = currentPointed.dataset.value || "";
      _state.selected = currentPointed;
      _state.open = false;
      _state.isEditing = false;

      return host.render();
    }

    if (key === "Escape") {
      const wasOpen = _state.open;
      _state.open = false;
      return wasOpen && host.render();
    }
  }

  _onArrowKeydown(event: KeyboardEvent) {
    event.preventDefault(); // so that the cursor does not move

    const { _nodes, _state } = this;
    if (!_state.open) {
      _state.open = true;
      return this.render();
    }

    const startPoint = this._getCurrentPointedElement();
    const ul = _nodes.ul;

    assert(ul !== null);

    const visibleLis = ul.querySelectorAll("li:not([hidden])");
    if (visibleLis.length === 0) return;

    const firstVisible = visibleLis[0];
    const lastVisible = visibleLis[visibleLis.length - 1];
    let elementToHighlight = startPoint;

    const { key } = event;
    if (key === "ArrowDown") {
      if (!startPoint) elementToHighlight = firstVisible;
      else if (startPoint === lastVisible) elementToHighlight = lastVisible;
      else {
        let elem = startPoint.nextElementSibling;
        while (elem && "hidden" in elem && elem.hidden) elem = elem.nextElementSibling;
        elementToHighlight = elem;
      }
    }

    if (key === "ArrowUp") {
      if (!startPoint) elementToHighlight = lastVisible;
      else if (startPoint === firstVisible) elementToHighlight = firstVisible;
      else {
        let elem = startPoint.previousElementSibling;
        while (elem && "hidden" in elem && elem.hidden) elem = elem.previousElementSibling;
        elementToHighlight = elem;
      }
    }

    _nodes.activeDescendant = elementToHighlight;
    this.render();

    this.addEventListener("pointermove", this._onPointerMove, { once: true });
  }

  _onPointerMove() {
    this._nodes.activeDescendant = null;
    this.render();
  }

  _onOuterElementFocus = (event: FocusEvent) => {
    const target = event.target as Node;
    if (!this.contains(target)) {
      this._state.open = false;
      this.render();
    }
  };

  _getCurrentPointedElement() {
    const { _nodes } = this;
    const { activeDescendant, ul, selected } = _nodes;

    return activeDescendant || ul?.querySelector("li:hover") || selected;
  }

  _visualizeSelected(li: HTMLElement, value: string) {
    const attr = "aria-selected";
    if (li.dataset.value === value) li.setAttribute(attr, "true");
    else li.removeAttribute(attr);
  }

  _visualizeKeyboardSelected(li: HTMLElement) {
    if (this._nodes.activeDescendant === li) li.classList.add(liClasses.keyboardFocused);
    else li.classList.remove(liClasses.keyboardFocused);
  }

  _filterOnInput(li: HTMLElement) {
    if (!this._state.isEditing) li.hidden = false;
    else {
      assert(this._nodes.input !== null);

      const inputValue = this._nodes.input.value.toLowerCase();
      const isMatch = li.textContent.toLowerCase().includes(inputValue);
      if (isMatch) li.hidden = false;
      else li.hidden = true;
    }
  }
}

initCustomElement("custom-autocomplete", CustomAutocomplete);

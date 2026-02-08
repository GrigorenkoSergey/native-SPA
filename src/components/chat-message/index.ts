import template from "./template.html";
import styles from "./style.css?raw";

import { initCustomElement, attachStyles } from "@/utils/customElementHelpers";
import { assert } from "@/utils/assert";

class ChatMessage extends HTMLElement {
  [key: string]: unknown;
  ["constructor"]!: typeof ChatMessage;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    assert(this.shadowRoot !== null);

    const initialContent = this.innerHTML;
    this.shadowRoot.innerHTML = template;
    attachStyles(this, styles);

    const contentSlot = this.shadowRoot.querySelector(".content");
    assert(contentSlot);
    contentSlot.innerHTML = initialContent;

    const timeContainer = this.shadowRoot.querySelector(".date");
    assert(timeContainer);

    const date = new Date(Number(this.getAttribute("timestamp")));
    timeContainer.textContent = date.toLocaleTimeString("ru");

    const img = this.shadowRoot.querySelector(".avatar");
    assert(img instanceof HTMLImageElement);

    const owner = this.getAttribute("owner");
    img.src = `images/${owner}.png`;
  }
}

initCustomElement("chat-message", ChatMessage);

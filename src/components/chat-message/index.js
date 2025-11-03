import template from "./template.html";
import styles from "./style.css?raw";

import { initCustomElement, attachStyles } from "@/utils/customElementHelpers";

class ChatMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const initialContent = this.innerHTML;
    console.log(initialContent);
    this.shadowRoot.innerHTML = template;
    attachStyles(this, styles);

    this.shadowRoot.querySelector(".content").innerHTML = initialContent;

    const timeContainer = this.shadowRoot.querySelector(".date");
    const date = new Date(+this.getAttribute("timestamp"));
    timeContainer.textContent = date.toLocaleTimeString("ru");

    const owner = this.getAttribute("owner");
    const img = this.shadowRoot.querySelector(".avatar");
    img.src = `images/${owner}.png`;
  }
}

initCustomElement("chat-message", ChatMessage);

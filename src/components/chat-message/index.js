import template from "./template.html";
import { initCustomElement } from "@/utils/customElementHelpers";
import "./style.css";

class ChatMessage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const initialContent = this.innerHTML;
    this.innerHTML = template;

    this.querySelector(".chat-message__content").innerHTML = initialContent;

    const timeContainer = this.querySelector(".chat-message__date");
    const date = new Date(+this.getAttribute("timestamp"));
    timeContainer.textContent = date.toLocaleTimeString("ru");

    const owner = this.getAttribute("owner");
    const img = this.querySelector(".chat-message__img");
    img.src = `images/${owner}.png`;
  }
}

initCustomElement("chat-message", ChatMessage);

import template from "./template.html";
import "./style.css";

import "@/components/chat-message/index";
import { initCustomElement } from "@/utils/customElementHelpers";
import { batchEffects } from "@/state-management/batchEffects";
import messagesStore from "@/stores/messagesStore";

class MessagesSection extends HTMLElement {
  constructor() {
    super();
    this.totalMessagesCount = 0;
    this.cleanups = [];
  }

  connectedCallback() {
    this.innerHTML = template;

    const cleanup = batchEffects(() => this._insertNewMessages());
    this.cleanups.push(cleanup);

    this.input = this.querySelector(".messages-section__textarea");
    this.input.addEventListener("input", event => {
      event.target.style.height = event.target.scrollHeight + "px";
    });

    const button = this.querySelector(".messages-section__button");
    button.addEventListener("click", event => this._handleMessageSend(event));
  }

  disconnectedCallback() {
    this.cleanups.forEach(func => func());
  }

  _handleMessageSend() {
    const newMessage = this.input.value;
    if (!newMessage) return;

    const owner = this.getAttribute("owner");

    messagesStore.messages.push({
      from: owner,
      content: this.input.value,
      timestamp: +new Date(),
    });

    const newMessages = messagesStore.messages;
    messagesStore.messages = newMessages;
    this.input.value = "";
    this.input.style.height = "";
  }

  _insertNewMessages() {
    const { messages } = messagesStore;
    const newMessages = messages.slice(this.totalMessagesCount);

    this.totalMessagesCount = messages.length;

    const owner = this.getAttribute("owner");
    const list = this.querySelector(".messages-section__list");

    newMessages.forEach(item => {
      if (item.from !== owner) item.read = true;
    });

    const nodes = newMessages.map(item => {
      const elem = document.createElement("chat-message");

      elem.textContent = item.content;
      elem.setAttribute("kind", item.from === owner ? "out" : "in");
      elem.setAttribute("timestamp", item.timestamp);
      elem.setAttribute("owner", item.from);
      if (item.read) elem.setAttribute("read", "");

      return elem;
    });

    list.append(...nodes);

    setTimeout(() => {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }, 50);
  }
}

initCustomElement("messages-section", MessagesSection);

import template from "./template.html";
import styles from "./style.css?raw";

import "@/components/chat-message/index";
import * as helpers from "@/utils/customElementHelpers";
import { batchEffects } from "@/state-management/batchEffects";
import messagesStore from "@/stores/messagesStore";

class MessagesSection extends HTMLElement {
  constructor() {
    super();
    this.totalMessagesCount = 0;
    this.cleanups = [];
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const { shadowRoot } = this;
    shadowRoot.innerHTML = template;
    helpers.attachStyles(this, styles);

    const cleanup = batchEffects(() => this._insertNewMessages());
    this.cleanups.push(cleanup);

    this.input = shadowRoot.querySelector(".textarea");
    this.input.addEventListener("input", event => {
      event.target.style.height = event.target.scrollHeight + "px";
    });

    const button = shadowRoot.querySelector(".button");
    button.addEventListener("click", event => this._onMessageSend(event));
  }

  disconnectedCallback() {
    this.cleanups.forEach(func => func());
  }

  _onMessageSend() {
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
    const list = this.shadowRoot.querySelector(".list");

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

helpers.initCustomElement("messages-section", MessagesSection);

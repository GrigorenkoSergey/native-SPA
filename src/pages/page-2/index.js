import store from "store";
import store2 from "store2";

import "./style.css";

console.log("page-2");
window.store2 = store;

const logic = () => {
  const span = document.querySelector(".store-value");
  span.textContent = store.inputValue;

  const input = document.querySelector("input");
  input.addEventListener("input", event => (store2.inputValue = event.target.value));
  input.value = store2.inputValue;
};

if (window) window.logic = logic;

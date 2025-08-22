import { store } from "../../stores/store.js";
import "./style.css";

window.store2 = store;
console.log("page-2");

const logic = () => {
  const span = document.querySelector(".store-value");
  span.textContent = store.inputValue;
};

if (window) window.logic = logic;

import { store } from "store";
import "./style.css";

window.store2 = store;
console.log("page-2");

const logic = () => {
  const span = document.querySelector(".store-value");
  span.textContent = store.inputValue;
};

logic();

if (window) window.logic = logic;

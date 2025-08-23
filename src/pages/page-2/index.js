import { store } from "store";
import "./style.css";

console.log("page-2");

const logic = () => {
  const span = document.querySelector(".store-value");
  span.textContent = store.inputValue;
};

if (window) window.logic = logic;

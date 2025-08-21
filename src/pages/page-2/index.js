import { store } from "../../stores/store.js";
import "./style.css";

console.log("page-2");

const logic = () => {
  const span = document.querySelector(".store-value");
  span.textContent = store.inputValue;
};

logic();

export default logic;

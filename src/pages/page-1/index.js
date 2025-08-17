import { store } from "../../stores/store.js";
import { derive } from "../../utils/state-management/index.js";
import "./style.css";

console.log("page-1");

const logic = () => {
  const input = document.querySelector("input");
  input.value = store.inputValue;
  input.addEventListener("input", event => (store.inputValue = event.target.value));

  let output = document.querySelector("output");

  derive(() => {
    output.textContent = store.inputValue;
  });
};

logic();

export default logic;

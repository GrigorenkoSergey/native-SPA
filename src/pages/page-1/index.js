import { store } from "store";
import { derive } from "state-management";
import "./style.css";

console.log("page-1");

window.store1 = store;
const logic = () => {
  const input = document.querySelector("input");
  input.value = store.inputValue;
  input.addEventListener("input", event => (store.inputValue = event.target.value));

  let output = document.querySelector("output");

  derive(() => {
    output.textContent = store.inputValue;
  });
};

if (window) window.logic = logic;

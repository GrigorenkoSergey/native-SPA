import store from "store";
import { events } from "@/constants/events.js";
import { derive } from "state-management";
import "./style.css";

console.log("page-1");

const logic = () => {
  const input = document.querySelector("input");
  input.value = store.inputValue;
  input.addEventListener("input", event => (store.inputValue = event.target.value));

  let output = document.querySelector("output");

  const cleanup = derive(() => {
    output.textContent = store.inputValue;
  });

  window.addEventListener(events.CHANGE_PAGE, () => cleanup());
};

if (window) window.logic = logic;
else logic();

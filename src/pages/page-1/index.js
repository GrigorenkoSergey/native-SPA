import { store } from "store";
import { derive } from "state-management";
import "./style.css";

console.log("page-1");

window.store1 = store;
const logic = () => {
  const input = document.querySelector("input");
  console.log("store", store)
  input.value = store.inputValue;
  input.addEventListener("input", event => (store.inputValue = event.target.value));

  let output = document.querySelector("output");

  derive(() => {
    output.textContent = store.inputValue;
  });
};

const newScript = document.createElement("script");
newScript.src = "http://localhost:8080/native-SPA/pages/page-2/index.js";

newScript.type = "module";
document.head.append(newScript);

logic();
if (window) window.logic = logic;

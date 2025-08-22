import { store } from "../../stores/store.js";
import { derive } from "../../utils/state-management/index.js";
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

const newScript = document.createElement("script");
newScript.src = "http://localhost:8081/native-SPA/pages/page-2/index.js";

newScript.type = "module";
document.head.append(newScript);

if (window) window.logic = logic;

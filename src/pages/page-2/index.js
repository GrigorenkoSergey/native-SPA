import { store } from "../../stores/store.js";

console.log("page-2");

export default () => {
  const span = document.querySelector(".store-value");
  span.textContent = store.inputValue;
};

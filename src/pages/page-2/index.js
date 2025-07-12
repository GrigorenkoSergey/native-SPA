import { store } from "../../stores/store";

console.log("page-2");

export default () => {
  const span = document.querySelector(".store-value");
  span.textContent = store.inputValue;
};

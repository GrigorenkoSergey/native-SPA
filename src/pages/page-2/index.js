import { store } from "../../stores/store.js";

console.log("page-2");

const logic = () => {
  const span = document.querySelector(".store-value");
  span.textContent = store.inputValue;
};

export default logic;

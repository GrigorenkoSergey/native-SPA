import { store } from "../../stores/store";

console.log("page-1");

export default () => {
  const input = document.querySelector("input");
  input.value = store.inputValue;
  input.addEventListener("input", event => (store.inputValue = event.target.value));

  let output = document.querySelector("output");
  output.textContent = store.inputValue;

  store.connect(output, ({ observable, listener }) => {
    listener.textContent = observable.inputValue;
  });
};

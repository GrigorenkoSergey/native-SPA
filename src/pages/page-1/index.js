import { events } from "../../constants/events";
import { store } from "../../stores/store";
import "./style.css";

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

  window.addEventListener(events.CHANGE_PAGE, () => {
    store.disconnect(output);
  });
};

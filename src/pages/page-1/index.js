import { makeObservable } from "../../utils/state";

const store = makeObservable({
  inputValue: "",
});

export default () => {
  const input = document.querySelector("input");
  input.value = store.inputValue;
  input.addEventListener("input", event => (store.inputValue = event.target.value));

  let output = document.querySelector("output");
  output.textContent = store.inputValue;

  store.connect(output, ({ observable, listener }) => {
    console.log("fun");
    listener.textContent = observable.inputValue;
  });

  const btn = document.querySelector("button");
  btn.addEventListener(
    "click",
    () => {
      output.remove();
      output = null;
    },
    { once: true },
  );
};

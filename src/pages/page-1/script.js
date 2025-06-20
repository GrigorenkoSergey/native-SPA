import { makeObservable } from "../../utils/state";

export default () => {
  const state = makeObservable({
    inputValue: "",
  });

  const input = document.querySelector("input");
  input.addEventListener("input", event => {
    console.log(event.target.value);
    state.inputValue = event.target.value;
  });
};

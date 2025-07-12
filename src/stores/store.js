import { makeObservable } from "../utils/state";
console.log("init common store");

export const store = makeObservable({
  inputValue: "",
});

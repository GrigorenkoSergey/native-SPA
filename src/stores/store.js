import { makeObservable } from "../utils/makeObservable";
console.log("init common store");

export const store = makeObservable({
  inputValue: "",
});

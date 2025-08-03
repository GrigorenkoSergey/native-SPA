import { makeObservable } from "../utils/state-management/makeObservable";
console.log("init common store");

export const store = makeObservable({
  inputValue: "",
});

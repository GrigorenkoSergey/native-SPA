import { createStore } from "../utils/state-management/createStore";
console.log("init common store");

export const store = createStore({
  inputValue: "",
});

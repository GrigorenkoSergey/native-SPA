import { createStore } from "../utils/state-management/createStore.js";
console.log("init common store");

export const store = createStore({
  inputValue: "",
});

import "./style.css";
import getState from "../../utils/initStore";

const state = await getState();

const input = document.querySelector("input");
input.value = state.inputValue;
input.addEventListener("input", event => (state.inputValue = event.target.value));

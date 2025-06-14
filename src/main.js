import "./components/my-app";
import "./components/custom-autocomplete";

import javascriptLogo from "/javascript.svg";
import viteLogo from "/vite.svg";

const app = document.getElementById("app");

const myApp = app.querySelector("my-app");

myApp.setAttribute("vite-logo", viteLogo);
myApp.setAttribute("js-logo", javascriptLogo);

const options1 = ["1", "2", "3", "4", "5"];
const options2 = ["Винни-Пух", "Пятачок", "Иа", "Сова", "Кролик"];

let optionsIndex = 0;
const ulPossibleOptions = [options1, options2];

const autocomplete = myApp.querySelector("custom-autocomplete");
autocomplete.setOptions(ulPossibleOptions[optionsIndex]);

const optsChanger = document.querySelector("#options-changer");
optsChanger.addEventListener("click", () => {
  optionsIndex = (optionsIndex + 1) % 2;
  autocomplete.setOptions(ulPossibleOptions[optionsIndex]);
});

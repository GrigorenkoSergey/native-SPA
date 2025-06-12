import "./components/my-app";
import "./components/custom-autocomplete";

import javascriptLogo from "/javascript.svg";
import viteLogo from "/vite.svg";

const app = document.getElementById("app");

const myApp = app.querySelector("my-app");

myApp.setAttribute("vite-logo", viteLogo);
myApp.setAttribute("js-logo", javascriptLogo);

const options1 = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
];

const options2 = [
  { label: "Винни-Пух", value: "Винни-Пух" },
  { label: "Пятачок", value: "Пятачок" },
  { label: "Иа", value: "Иа" },
  { label: "Сова", value: "Сова" },
  { label: "Кролик", value: "Кролик" },
];

let optionsIndex = 0;
const ulPossibleOptions = [options1, options2];

const autocomplete = myApp.querySelector("custom-autocomplete");
autocomplete.setOptions(ulPossibleOptions[optionsIndex]);

const optsChanger = document.querySelector("#options-changer");
optsChanger.addEventListener("click", () => {
  optionsIndex = (optionsIndex + 1) % 2;
  autocomplete.setOptions(ulPossibleOptions[optionsIndex]);
});

import "./components/button-with-counter"
import "./components/my-app";
import "./components/custom-autocomplete";

import javascriptLogo from '/javascript.svg'
import viteLogo from '/vite.svg'

const app = document.getElementById("app");

const myApp = app.querySelector("my-app");

myApp.setAttribute("vite-logo", viteLogo);
myApp.setAttribute("js-logo", javascriptLogo);
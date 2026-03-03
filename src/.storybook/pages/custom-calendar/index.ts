import {CustomCalendar} from "@/components/custom-calendar";
import fullyCustomizedCSS from "./fully-customized.css?raw";
import "./style.css";

const additionalStyles = document.getElementById("additional-styles") as HTMLTemplateElement;
CustomCalendar.defaultStyles
  .push(additionalStyles.content.cloneNode(true) as HTMLStyleElement);
CustomCalendar.init();

const styleTag = document.createElement("style");
styleTag.textContent = fullyCustomizedCSS;

const fullyCustomized = document.querySelector("[data-testid='styles-customized-full']");
fullyCustomized?.shadowRoot?.getElementById("default-style")?.replaceWith(styleTag);
import {CustomCalendar} from "@/components/custom-calendar";
import fullyCustomizedCSS from "./fully-customized.css?raw";
import { assert } from "@/utils/assert";
import "./style.css";

const additionalStyles = document.getElementById("additional-styles") as HTMLTemplateElement;
CustomCalendar.defaultStyles
  .push(additionalStyles.content.cloneNode(true) as HTMLStyleElement);
CustomCalendar.init();

const basic = document.querySelector("[data-testid='basic']");
assert(basic instanceof CustomCalendar);

const renderCount = document.querySelector("[data-testid='basic-renders-count']");
assert(renderCount);

const originalRender = basic.render;
basic.render = function (...args) {
  const currentCount = +renderCount.textContent;
  renderCount.textContent = String(currentCount + 1);
  return originalRender.call(basic, ...args);
};

const styleTag = document.createElement("style");
styleTag.textContent = fullyCustomizedCSS;

const fullyCustomized = document.querySelector("[data-testid='styles-customized-full']");
fullyCustomized?.shadowRoot?.getElementById("default-style")?.replaceWith(styleTag);
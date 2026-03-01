import {CustomCalendar} from "@/components/custom-calendar";
import fullyCustomizedCSS from "./fully-customized.css?raw";
import { assert } from "@/utils/assert";

const customized = document.querySelector("[data-testid=\"styles-custimezed-1\"]");
const styleTag = document.createElement("style");
styleTag.textContent = fullyCustomizedCSS;

const newStyles = styleTag;

assert(customized instanceof CustomCalendar);
customized.styles = [newStyles];
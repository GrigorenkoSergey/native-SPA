import "./utilities.css";
import "@/components/main-nav";
import { applyRouting, DynamicRoutes } from "@/utils/applyRouting";

console.log("main");

const dynamicRoutes: DynamicRoutes = [[/pages\/dynamic\/\w+/, "pages/dynamic-page/"]];

applyRouting({ dynamicRoutes });

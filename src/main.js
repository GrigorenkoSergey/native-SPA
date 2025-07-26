import "./components/app-nav";
import { applyRouting } from "./utils/applyRouting";

const getPageLogic = async pathname => {
  switch (pathname) {
    case "/page-1":
      return (await import("./pages/page-1/index.js")).default;
    case "/page-2":
      return (await import("./pages/page-2/index.js")).default;
    default:
      return (await import("./pages/page-404/index.js")).default;
  }
};

applyRouting({
  getPageLogic,
  base: "/native-SPA/",
});

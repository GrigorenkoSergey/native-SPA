import { applyRouting } from "../utils/applyRouting";

const getPageLogic = async pathname => {
  switch (pathname) {
    case "/custom-autocomplete":
      return (await import("./pages/custom-autocomplete/index.js")).default;
    default:
      return (await import("./pages/component-404/index.js")).default;
  }
};

applyRouting({
  defaultPage: "/custom-autocomplete",
  page404: "/component-404",
  getPageLogic,
});

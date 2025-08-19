import { events } from "../constants/events.js";

const MAX_ATTEMPTS_TO_LOAD_RESOURCE = 10;
const PAGES_DIR = "pages/";

const base = document.querySelector("base").href;

/*
 При действительном изменении страницы в пределах проекта, добавим событие смены страницы для очистки памяти при
 переходах по различным страницам
*/
export const applyRouting = ({
  // getPageLogic,
  // pageContentContainer = "main",
  defaultPage = "page-1",
  // page404 = "page-404",
}) => {
  const buildPage = async (url, attempt = 0) => {
    if (attempt > MAX_ATTEMPTS_TO_LOAD_RESOURCE) return;

    // debugger;
    const { pathname } = new URL(url);

    if (pathname === base) {
      const defaultUrl = `${base}${defaultPage}`;
      window.history.replaceState(null, "", defaultUrl);
      return buildPage(defaultUrl, attempt + 1);
    }

    const pageTemplateUrl = url + "index.html";
    console.log(pageTemplateUrl);
    // const scriptSrc = url + "index.";
    // const pageScriptUrl = [...document.scripts].find(script => script.src.includes(scriptSrc));

    try {
      const response = await fetch(pageTemplateUrl, { cache: "force-cache" });
      // const response = await fetch(pageTemplateUrl, { cache: "no-cache" });
      // const response = await fetch(pageTemplateUrl);
      const template = await response.text();
      console.log("template", template);

      // document.writeln(template);
      document.documentElement.innerHTML = template;
      // document.innerHTML = template;

      // const logic = await getPageLogic(pathToPageFromPagesDir);
      // logic?.();
    } catch {
      // buildPage(window.location.origin + page404, attempt + 1);
    }
  };

  window.history.pushState = new Proxy(window.history.pushState, {
    async apply(...args) {
      const url = args[2][2];
      if (url !== window.location.href) buildPage(url);

      return Reflect.apply(...args);
    },
  });

  window.addEventListener("popstate", event => {
    const { href } = event.target.location;
    if (href.includes("#")) return;
    buildPage(href);
  });

  document.addEventListener("click", async event => {
    const isInnerLink = "innerLink" in event.target.dataset;
    if (!isInnerLink) return;

    event.preventDefault();

    const link = event.target;
    const currentHref = window.location.href;
    const currentPathname = new URL(window.location.href).pathname;

    const newHref = new URL(link.href, window.location.href).href;
    if (newHref === currentHref) return;

    window.history.pushState(null, "", newHref);

    const newPathname = new URL(newHref).pathname;

    if (currentPathname !== newPathname) {
      window.dispatchEvent(
        new CustomEvent(events.CHANGE_PAGE, {
          detail: {
            prev: currentHref,
            next: newHref,
          },
        }),
      );
    }
  });
};

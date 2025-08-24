import { events } from "../constants/events.js";

const MAX_ATTEMPTS_TO_LOAD_RESOURCE = 10;

const base = document.querySelector("base").href;
const pageLogics = {};

const getPageScript = url => {
  const { origin, pathname } = new URL(url);
  const srcPattern = origin + pathname + "index.";
  return [...document.scripts].find(script => script.src.includes(srcPattern));
};

/*
 При действительном изменении страницы в пределах проекта, добавим событие смены страницы для очистки памяти при
 переходах по различным страницам
*/
export const applyRouting = ({ defaultPage = "pages/page-1" }) => {
  if (!window) return;

  const buildPage = async (url, attempt = 0) => {
    if (attempt > MAX_ATTEMPTS_TO_LOAD_RESOURCE) return;

    const { pathname } = new URL(url);

    if (pathname === base) {
      const defaultUrl = `${base}${defaultPage}`;
      window.history.replaceState(null, "", defaultUrl);
      return buildPage(defaultUrl, attempt + 1);
    }

    const pageTemplateUrl = url + "index.html";

    try {
      const response = await fetch(pageTemplateUrl);
      const template = await response.text();

      document.documentElement.innerHTML = template;

      const pageScriptElement = getPageScript(url);
      const scriptKey = pageScriptElement.src;
      pageScriptElement.remove();

      const newScript = document.createElement("script");
      newScript.src = scriptKey;
      newScript.type = "module";
      document.head.append(newScript);

      if (scriptKey in pageLogics) return pageLogics[scriptKey]?.();

      newScript.onload = () => {
        pageLogics[scriptKey] = window.logic;
        pageLogics[scriptKey]?.();
      };
    } catch (error) {
      console.error(`Failed to load page ${url}`, error);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const pageScriptElement = getPageScript(window.location.href);
    const scriptKey = pageScriptElement.src;

    pageLogics[scriptKey] = window.logic;
    pageLogics[scriptKey]?.();
  });

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

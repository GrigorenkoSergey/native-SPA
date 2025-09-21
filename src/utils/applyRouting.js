const base = document.querySelector("base").href;
const pageLogics = {};
let cleanup;

/*
 При действительном изменении страницы в пределах проекта, добавим событие смены страницы для очистки памяти при
 переходах по различным страницам
*/
export function applyRouting({ defaultPage = "pages/page-1/" }) {
  if (!window) return;

  document.addEventListener("DOMContentLoaded", async () => {
    const { pathname } = new URL(window.location.href);
    const { pathname: basePathname } = new URL(base);

    if (pathname === basePathname) {
      const defaultUrl = `${base}${defaultPage}`;
      return (window.location.href = defaultUrl);
    }
    applyPageLogic(window.location.href);
  });

  window.history.pushState = new Proxy(window.history.pushState, {
    async apply(...args) {
      const url = args[2][2];

      const newPathname = new URL(url).pathname;
      const oldPathName = new URL(window.location.href).pathname;
      if (newPathname !== oldPathName) buildPage(url);

      return Reflect.apply(...args);
    },
  });

  window.addEventListener("popstate", event => {
    const { href } = event.target.location;
    buildPage(href);
  });

  document.addEventListener("click", async event => {
    const isInnerLink = "innerLink" in event.target.dataset;
    if (!isInnerLink) return;

    event.preventDefault();

    const link = event.target;

    const currentHref = window.location.href;
    const newHref = new URL(link.href, window.location.href).href;

    if (newHref !== currentHref) {
      window.history.pushState(null, "", newHref);
    }
  });
}

async function buildPage(url) {
  const pageTemplateUrl = url + "index.html";

  const response = await fetch(pageTemplateUrl);
  const template = await response.text();

  const newDocument = new DOMParser().parseFromString(template, "text/html");

  addHeadStylesheets(newDocument); // заметно только в production-mode
  addHeadScripts(newDocument);
  document.body.replaceWith(newDocument.body);

  applyPageLogic(url);
}

function getPageScript(url) {
  const { origin, pathname } = new URL(url);
  const srcPattern = origin + pathname + "index.";
  return [...document.scripts].find(script => script.src.includes(srcPattern));
}

function addHeadStylesheets(newDocument) {
  return addNewRemoveStaleElements(newDocument, "link[rel=stylesheet]", "href");
}

function addHeadScripts(newDocument) {
  return addNewRemoveStaleElements(newDocument, "script", "src");
}

function addNewRemoveStaleElements(newDocument, headSelector, attr) {
  const newElements = [...newDocument.head.querySelectorAll(headSelector)];
  const oldElements = [...document.head.querySelectorAll(headSelector)];
  const allElements = [...oldElements, ...newElements];

  for (const element of allElements) {
    const isInNew = newElements.find(elements => elements[attr] === element[attr]);
    const isInOld = oldElements.find(elements => elements[attr] === element[attr]);
    const isCommon = isInNew && isInOld;
    if (isCommon) continue;

    if (isInOld) element.remove();
    else document.head.append(element);
  }
}

async function applyPageLogic(url) {
  cleanup?.();

  const pageScriptElement = getPageScript(url);
  const scriptKey = pageScriptElement.src;
  if (scriptKey in pageLogics) return pageLogics[scriptKey]?.();

  const logic = (await import(/* webpackIgnore: true */ scriptKey)).default;
  pageLogics[scriptKey] = logic;
  cleanup = pageLogics[scriptKey]?.();
}

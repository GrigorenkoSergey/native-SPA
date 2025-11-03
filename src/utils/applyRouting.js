const base = document.querySelector("base").href;
const pageLogics = {};
let cleanup;

/**
 * Для определенных ссылок, помеченных атрибутов data-inner-link предотвращает действие по умолчанию.
 * Нажатие по данным ссылкам вызовет перестроение страницы без действительного перехода по ссылке.
 * Для логики, которая постоянно должна вызываться при загрузке страницы, ее нужно экспортировать
 * по умолчанию.
 * @param {Object} config
 * @property {String} config.defaultPage
 * @property {Array} config.dynamicRoutes - список динамических роутов вида [regexp, string], где
 *  regexp - регулярка с адресом страницы
 *  string - адрес соответствующей страницы (без слеша спереди, как и в defaultPage)
 *  пример - [ [/pages\/dynamic\/\w+/, "pages/dynamic-page/"], [...] ]
 * @returns {void}
 */
export function applyRouting({ defaultPage = "pages/page-1/", dynamicRoutes = [] }) {
  if (!window) return;

  document.addEventListener("DOMContentLoaded", async () => {
    const windowHref = window.location.href;
    const { pathname } = new URL(windowHref);
    const { pathname: basePathname } = new URL(base);

    if (pathname === basePathname) {
      const defaultUrl = `${base}${defaultPage}`;
      return (window.location.href = defaultUrl);
    }

    if (getDynamicUrl(windowHref, dynamicRoutes)) {
      return buildPage(windowHref, dynamicRoutes);
    }

    applyPageLogic(windowHref);
  });

  window.history.pushState = new Proxy(window.history.pushState, {
    async apply(...args) {
      const url = args[2][2];

      const newPathname = new URL(url).pathname;
      const oldPathName = new URL(window.location.href).pathname;
      if (newPathname !== oldPathName) buildPage(url, dynamicRoutes);

      return Reflect.apply(...args);
    },
  });

  window.addEventListener("popstate", event => {
    const { href } = event.target.location;
    buildPage(href, dynamicRoutes);
  });

  document.addEventListener("click", async event => {
    const path = event.composedPath();
    const innerLink = path.find(item => item instanceof Element && item.hasAttribute("data-inner-link"));
    if (!innerLink) return;

    event.preventDefault();

    const currentHref = window.location.href;
    const newHref = new URL(innerLink.href, window.location.href).href;

    if (newHref !== currentHref) {
      window.history.pushState(null, "", newHref);
    }
  });
}

function getDynamicUrl(url, dynamicRoutes) {
  const { pathname } = new URL(url);
  const dynamicPage = dynamicRoutes.find(([pattern]) => pattern.test(pathname));

  return dynamicPage ? base + dynamicPage[1] : undefined;
}

async function buildPage(initialUrl, dynamicRoutes) {
  const url = getDynamicUrl(initialUrl, dynamicRoutes) || initialUrl;

  const pageTemplateUrl = url + "index.html";

  const response = await fetch(pageTemplateUrl);
  const template = await response.text();

  const newDocument = new DOMParser().parseFromString(template, "text/html");

  addHeadStylesheets(newDocument);
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
  const scriptKey = pageScriptElement?.src;
  if (!scriptKey) return;

  if (scriptKey in pageLogics) return pageLogics[scriptKey]?.();

  const logic = (await import(/* webpackIgnore: true */ scriptKey)).default;
  pageLogics[scriptKey] = logic;
  cleanup = pageLogics[scriptKey]?.();
}

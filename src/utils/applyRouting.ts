const base = document.querySelector("base")?.href || "";

const pageLogics: {
  [path: string]: () => () => void;
} = {};

let cleanup: () => void;

export type DynamicRoutes = Array<[RegExp, string]>;
interface ApplyRoutingArgs {
  /** Страница по умолчанию (без ведущего слеша) */
  defaultPage?: string;
  /** 
   * Динамические маршруты для сопоставления 
   * 
   * @remarks
   * Каждый элемент массива представляет собой кортеж:
   * 1. `RegExp` - регулярное выражение для сопоставления URL
   * 2. `string` - целевая страница (формат как у `defaultPage`)
   * 
   * @example
   * ```
   * [[/pages\/dynamic\/\w+/, "pages/dynamic-page/"]]
   * ```
   */
  dynamicRoutes?: DynamicRoutes,
}

/**
 * Для определенных ссылок, помеченных атрибутов data-inner-link предотвращает действие по умолчанию.
 * Нажатие по данным ссылкам вызовет перестроение страницы без действительного перехода по ссылке.
 * Для логики, которая постоянно должна вызываться при загрузке страницы, ее нужно экспортировать
 * по умолчанию.
 */
export function applyRouting({
  defaultPage = "pages/page-1/",
  dynamicRoutes = [],
}: ApplyRoutingArgs) {
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

  window.addEventListener("popstate", () => {
    const { href } = window.location;
    buildPage(href, dynamicRoutes);
  });

  document.addEventListener("click", async event => {
    const path = event.composedPath();
    const innerLink = path.find(item => isInnerLink(item));
    if (!innerLink) return;

    event.preventDefault();

    const currentHref = window.location.href;
    const newHref = new URL(innerLink.href, window.location.href).href;

    if (newHref !== currentHref) {
      window.history.pushState(null, "", newHref);
    }

    function isInnerLink(element: EventTarget): element is HTMLLinkElement {
      return element instanceof HTMLAnchorElement &&
        element.hasAttribute("data-inner-link");
    }
  });
}

function getDynamicUrl(url: string, dynamicRoutes: DynamicRoutes) {
  const { pathname } = new URL(url);
  const dynamicPage = dynamicRoutes.find(([pattern]) => pattern.test(pathname));

  return dynamicPage ? base + dynamicPage[1] : undefined;
}

async function buildPage(initialUrl: string, dynamicRoutes: DynamicRoutes) {
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

function getPageScript(url: string) {
  const { origin, pathname } = new URL(url);
  const srcPattern = origin + pathname + "index.";
  return Array.from(document.scripts).find(script => script.src.includes(srcPattern));
}

function addHeadStylesheets(newDocument: HTMLDocument) {
  return addNewRemoveStaleElements(newDocument, "link[rel=stylesheet]", "href");
}

function addHeadScripts(newDocument: HTMLDocument) {
  return addNewRemoveStaleElements(newDocument, "script", "src");
}

function addNewRemoveStaleElements(
  newDocument: HTMLDocument,
  headSelector: string,
  attr: string,
) {
  const newElements = Array.from(newDocument.head.querySelectorAll(headSelector));
  const oldElements = Array.from(document.head.querySelectorAll(headSelector));
  const allElements = [...oldElements, ...newElements];

  for (const element of allElements) {
    const oldArrtibute = element.getAttribute(attr);
    const isInNew = newElements.find(elem => elem.getAttribute(attr) === oldArrtibute);
    const isInOld = oldElements.find(elem => elem.getAttribute(attr) === oldArrtibute);
    const isCommon = isInNew && isInOld;
    if (isCommon) continue;

    if (isInOld) element.remove();
    else document.head.append(element);
  }
}

async function applyPageLogic(url: string) {
  cleanup?.();

  const pageScriptElement = getPageScript(url);
  const scriptKey = pageScriptElement?.src;
  if (!scriptKey) return;

  if (scriptKey in pageLogics) return pageLogics[scriptKey]?.();

  const logic = (await import(/* webpackIgnore: true */ scriptKey)).default;
  pageLogics[scriptKey] = logic;
  cleanup = pageLogics[scriptKey]?.();
}

const RELATIVE_PATH_TO_PAGES_DIR = "../pages";
const PAGE_CONTENT_CONTAINER = "main";
const PAGE_CSS_CONTAINER_ID = "page-css";

const buildPage = async url => {
  const { pathname, search } = new URL(url);
  const page = RELATIVE_PATH_TO_PAGES_DIR + pathname + search;

  const insertCSS = async () => {
    const pageCssContainer = document.getElementById(PAGE_CSS_CONTAINER_ID);
    if (pageCssContainer) pageCssContainer.remove();

    const link = document.createElement("link");
    link.id = PAGE_CSS_CONTAINER_ID;
    link.rel = "stylesheet";
    link.href = page + "/style.css";
    document.head.appendChild(link);
  };

  const insertHTML = async () => {
    const response = await fetch(page + "/template.html");
    const template = await response.text();

    const pageContainer = document.querySelector(PAGE_CONTENT_CONTAINER);
    pageContainer.innerHTML = template;
  };

  const executeScript = async () => {
    const logic = (await import(page + "/index.js")).default;
    await logic?.();
  };

  await insertCSS();
  await insertHTML();
  await executeScript();
};

document.addEventListener("DOMContentLoaded", () => buildPage(window.location.href));

window.history.pushState = new Proxy(window.history.pushState, {
  async apply(...args) {
    const url = args[2][2];
    buildPage(url);

    return Reflect.apply(...args);
  },
});

window.addEventListener("popstate", event => {
  buildPage(event.target.location.href);
});

document.addEventListener("click", async event => {
  const link = event.target.closest("a");
  if (!link) return;

  const isExternalLink = new URL(link.href).origin !== window.location.origin;
  if (isExternalLink) return;

  event.preventDefault();

  const newUrl = new URL(link.href, window.location.href);
  window.history.pushState(null, "", newUrl.href);
});

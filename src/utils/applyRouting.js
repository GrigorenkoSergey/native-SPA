const RELATIVE_PATH_TO_PAGES_DIR = "../pages";
const PAGE_CONTENT_CONTAINER = "main";

const buildPage = async url => {
  const { pathname, search } = new URL(url);
  const page = RELATIVE_PATH_TO_PAGES_DIR + pathname + search;

  const content = (await import(/* @vite-ignore */ page)).default;

  const pageContainer = document.querySelector(PAGE_CONTENT_CONTAINER);
  pageContainer.innerHTML = content;
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

import { events } from "../constants/events";

const MAX_ATTEMPTS_TO_LOAD_RESOURCE = 10;
const PAGES_DIR = "pages/";

const base = import.meta.env.VITE_BASE_URL || "/";

export const applyRouting = ({
  getPageLogic,
  pageContentContainer = "main",
  defaultPage = "page-1",
  page404 = "page-404",
}) => {
  const buildPage = async (url, attempt = 0) => {
    if (attempt > MAX_ATTEMPTS_TO_LOAD_RESOURCE) return;

    const { pathname, search, origin } = new URL(url);

    if (pathname === base) {
      const defaultUrl = `${origin}${base}${defaultPage}`;
      window.history.replaceState(null, "", defaultUrl);
      return buildPage(defaultUrl, attempt + 1);
    }

    const pathToPages = base + PAGES_DIR;
    const pathToPageFromPagesDir = pathname.replace(base, "");
    const pageUrl = pathToPages + pathToPageFromPagesDir + search;

    try {
      const response = await fetch(pageUrl + "/template.html", { cache: "force-cache" });
      const template = await response.text();

      const pageContainer = document.querySelector(pageContentContainer);
      pageContainer.innerHTML = template;

      const logic = await getPageLogic(pathToPageFromPagesDir);
      logic?.();
    } catch {
      buildPage(window.location.origin + page404, attempt + 1);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const baseTag = document.createElement("base");
    baseTag.href = base;
    document.head.prepend(baseTag);

    buildPage(window.location.href);
  });

  window.history.pushState = new Proxy(window.history.pushState, {
    async apply(...args) {
      const url = args[2][2];
      // TODO учесть, что перемещения могут быть в пределах одной страницы..
      buildPage(url);

      return Reflect.apply(...args);
    },
  });

  window.addEventListener("popstate", event => {
    const { href } = event.target.location;
    if (href.includes("#")) return;
    // TODO учесть, что перемещения могут быть в пределах одной страницы..

    buildPage(href);
  });

  document.addEventListener("click", async event => {
    const link = event.target.closest("a");
    if (!link) return;

    const linkUrl = new URL(link.href);
    const isExternalLink = linkUrl.origin !== window.location.origin;
    if (isExternalLink) return;

    const isAnchor = link.getAttribute("href").startsWith("#");
    if (isAnchor) return;

    event.preventDefault();

    const newUrl = new URL(link.href, window.location.href);
    window.history.pushState(null, "", newUrl.href);

    window.dispatchEvent(
      new CustomEvent(events.CHANGE_PAGE, {
        detail: {
          prev: window.location.href,
          next: newUrl.href,
        },
      }),
    );
  });
};

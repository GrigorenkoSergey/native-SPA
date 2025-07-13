const MAX_ATTEMPTS_TO_LOAD_RESOURCE = 10;

export const applyRouting = ({
  relativePathToPagedDir = "../pages",
  pageContentContainer = "main",
  pageCssContainerID = "page-css",
  defaultPage = "/page-1",
  page404 = "/page-404",
}) => {
  const buildPage = async (url, attempt = 0) => {
    if (attempt > MAX_ATTEMPTS_TO_LOAD_RESOURCE) return;

    const { pathname, search } = new URL(url);
    if (pathname === "/") {
      return (window.location.href = defaultPage);
    }

    const page = relativePathToPagedDir + pathname + search;

    const insertHTML = async () => {
      const response = await fetch(page + "/template.html", { cache: "force-cache" });
      const template = await response.text();

      const pageContainer = document.querySelector(pageContentContainer);
      pageContainer.innerHTML = template;
    };

    const insertCSS = async () => {
      const pageCssContainer = document.getElementById(pageCssContainerID);
      if (pageCssContainer) pageCssContainer.remove();

      const link = document.createElement("link");
      link.id = pageCssContainerID;
      link.rel = "stylesheet";
      link.href = page + "/style.css";
      document.head.appendChild(link);
    };

    const executeScript = async () => {
      const response = await import(/* @vite-ignore */ page + "/index.js", { cache: "force-cache" });
      const logic = response.default;
      await logic?.();
    };

    try {
      await insertHTML();
      await insertCSS();
      await executeScript();
    } catch {
      buildPage(window.location.origin + page404, attempt + 1);
    }
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
};

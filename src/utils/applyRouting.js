const MAX_ATTEMPTS_TO_LOAD_RESOURCE = 10;

export const applyRouting = ({
  relativePathToPagesDir = "../pages",
  pageContentContainer = "main",
  getPageLogic,
  defaultPage = "/page-1",
  page404 = "/page-404",
}) => {
  const buildPage = async (url, attempt = 0) => {
    if (attempt > MAX_ATTEMPTS_TO_LOAD_RESOURCE) return;

    const { pathname, search, origin } = new URL(url);
    if (pathname === "/") {
      const defaultUrl = origin + defaultPage;
      window.history.replaceState(null, "", defaultUrl);
      return buildPage(defaultUrl, attempt + 1);
    }

    const page = relativePathToPagesDir + pathname + search;

    try {
      const response = await fetch(page + "/template.html", { cache: "force-cache" });
      const template = await response.text();

      const pageContainer = document.querySelector(pageContentContainer);
      pageContainer.innerHTML = template;

      const logic = await getPageLogic(pathname);
      logic?.();
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

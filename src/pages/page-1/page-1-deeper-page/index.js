import "@/components/custom-autocomplete/index.js";
import "./style.css";

const getQuery = () => new URLSearchParams(window.location.search).get("hero");

const logic = () => {
  const originPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    return originPushState.apply(this, args);
  };

  const autocomplete = document.querySelector("custom-autocomplete");
  autocomplete.setOptions(["Винни Пух", "Пятачок", "Иа", "Сова", "Кролик"]);
  autocomplete.value = decodeURI(getQuery() || "");

  autocomplete.addEventListener(autocomplete.events.change, data => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("hero", data.detail.newValue);
    window.history.pushState({}, null, newUrl.href);
  });

  const span = document.createElement("span");
  span.dataset.testid = "created-span";
  span.textContent = "Hello from script!";

  document.body.append(span);

  return () => {
    window.history.pushState = originPushState;
  };
};

export default logic;

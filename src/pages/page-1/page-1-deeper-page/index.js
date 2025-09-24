import "@/components/custom-autocomplete";
import "./style.css";

const getQuery = () => new URLSearchParams(window.location.search).get("hero");

const logic = () => {
  const autocomplete = document.querySelector("custom-autocomplete");
  autocomplete.setOptions(["Винни Пух", "Пятачок", "Иа", "Сова", "Кролик"]);
  autocomplete.value = decodeURI(getQuery() || "");

  autocomplete.addEventListener(autocomplete.events.change, data => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("hero", data.detail.newValue);
    window.history.pushState({}, null, newUrl.href);
  });
};

export default logic;

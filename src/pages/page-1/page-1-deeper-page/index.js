import "@/components/custom-autocomplete";
import "./style.css";

import { createStore, derive } from "@/state-management";

const getQuery = () => new URLSearchParams(window.location.search).get("hero");

const logic = () => {
  const options = ["Винни Пух", "Пятачок", "Иа", "Сова", "Кролик"];

  const heroAutocomplete = document.querySelector("[name=hero]");
  heroAutocomplete.setOptions(options);

  const styledAutocomplete = document.querySelector("[name='styles-example']");
  styledAutocomplete.setOptions(options);

  const store = createStore({ hero: decodeURI(getQuery() || "") });

  const cleanup = derive(() => {
    styledAutocomplete.value = store.hero;
    heroAutocomplete.value = store.hero;
  });

  const syncUrlWithValue = data => {
    const { newValue, attribute, source } = data.detail;
    if (attribute !== "value") return;
    if (source === "program") return;

    store.hero = newValue;

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("hero", store.hero);
    window.history.pushState({}, null, newUrl.href);
  };

  heroAutocomplete.addEventListener(heroAutocomplete.events.change, syncUrlWithValue);
  styledAutocomplete.addEventListener(styledAutocomplete.events.change, syncUrlWithValue);

  return () => cleanup();
};

export default logic;

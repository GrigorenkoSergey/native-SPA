import { CustomAutocomplete, type CEvent } from "@/components/custom-autocomplete";

import "./style.css";

import { createStore, derive } from "@/state-management";

const getQuery = () => new URLSearchParams(window.location.search).get("hero");

const logic = () => {
  const options = ["Винни Пух", "Пятачок", "Иа", "Сова", "Кролик"];

  const heroAutocomplete = document.querySelector("[name=hero]");
  const styledAutocomplete = document.querySelector("[name='styles-example']");
  if (
    !(heroAutocomplete instanceof CustomAutocomplete) ||
    !(styledAutocomplete instanceof CustomAutocomplete)
  ) throw new Error();

  heroAutocomplete.setOptions(options);
  styledAutocomplete.setOptions(options);

  const store = createStore({ hero: decodeURI(getQuery() || "") });

  const cleanup = derive(() => {
    styledAutocomplete.value = store.hero;
    heroAutocomplete.value = store.hero;
  });

  const syncUrlWithValue = (event: CEvent) => {
    const { newValue, attribute, source } = event.detail;
    if (attribute !== "value") return;
    if (source === "program") return;

    store.hero = String(newValue);

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("hero", store.hero);
    window.history.pushState({}, "", newUrl.href);
  };

  const changeEvent = heroAutocomplete.events.change;
  heroAutocomplete.addEventListener(changeEvent, syncUrlWithValue as EventListener);
  styledAutocomplete.addEventListener(changeEvent, syncUrlWithValue as EventListener);

  return () => cleanup();
};

export default logic;

const dbName = "db";
const storeName = "store";
const keyPath = "state";

// indexedDB.deleteDatabase(dbName);

const origin = window.location.origin;

let state;

const addSaveStateOnNavigation = () => {
  document.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link) return;

    const isExternalLink = new URL(link.href).origin !== origin;
    if (isExternalLink) return;

    let req = indexedDB.open(dbName);
    req.onsuccess = () => {
      const db = req.result;
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      store.put(state);
    };
  });
};

const getState = async () => {
  await new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(dbName);

    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath });
      }
    };

    openRequest.onerror = reject;

    openRequest.onsuccess = () => {
      const db = openRequest.result;

      let transaction = db.transaction(storeName);
      const store = transaction.objectStore(storeName);

      let req = store.get(keyPath);

      req.onsuccess = () => {
        state = req.result;
        resolve();
      };

      req.onerror = reject;
    };
  });

  return state;
};

addSaveStateOnNavigation();

export default getState;

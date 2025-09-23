/**
 * Исходная, наивная реализация хранилища
 * @param {Object} obj
 * @returns {Object}
 */
const createStore = obj => {
  let store = {
    ...obj,

    listeners: new Map(),

    connect(listener, callback) {
      /**
       * Введем слабые ссылки как защиту от дурака.
       * По-хорошему, необходимо очищать память при переходах между страницами (если хранилище общее),
       * удалять подписки, когда подписчик уничтожен и т.д.
       */
      const ref = new WeakRef(listener);
      this.listeners.set(ref, callback);
    },

    disconnect(listener) {
      this.listeners.forEach((callback, ref) => {
        const currentListener = ref.deref();
        if (currentListener === listener) this.listeners.delete(ref);
      });
    },

    /**
     * Для того, чтобы не препятствовать сборщику мусора удалять подписки уничтоженных подписчиков,
     * желательно обращаться к слушателю через свойство listener.
     */
    notify({ observable, prop, value }) {
      this.listeners.forEach((callback, ref) => {
        const listener = ref.deref();
        if (!listener) return this.listeners.delete(ref);

        callback({ observable, listener, prop, value });
      });
    },
  };

  store = new Proxy(store, {
    set(...args) {
      const [observable, prop, value] = args;
      queueMicrotask(() => observable.notify({ observable, prop, value }));

      return Reflect.set(...args);
    },
  });

  return store;
};

export { createStore };

const makeObservable = obj => {
  let store = {
    ...obj,

    listeners: new Map(),

    connect(listener, callback) {
      const ref = new WeakRef(listener);
      this.listeners.set(ref, callback);

      return () => this.listeners.delete(ref);
    },

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

console.clear();

export { makeObservable };

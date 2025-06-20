const makeObservable = obj =>
  new Proxy(obj, {
    set(...args) {
      const [target, key, value] = args;
      console.log("Установка свойства ", key);
      console.log("Значение ", value);

      return Reflect.set(...args);
    },
  });

console.clear();

let store = {
  listeners: new Map(),

  connect(listener, func) {
    const ref = new WeakRef(listener);
    this.listeners.set(ref, func);

    return () => this.listeners.delete(ref);
  },

  notify({ target, prop, value }) {
    this.listeners.forEach((f, ref) => {
      const listener = ref.deref();
      if (!listener) return this.listeners.delete(ref);

      f({ target, listener, prop, value });
    });
  },
};

store = new Proxy(store, {
  set(...args) {
    const [target, prop, value] = args;

    if (prop === "listeners" || prop === "connect" || prop === "notify") {
      throw new Error("Нельзя переписать служебные свойства");
    }

    queueMicrotask(() => target.notify({ target, prop, value }));

    return Reflect.set(...args);
  },
});
/**
 * HTML
  <input type="text">
  <output></output>
  <br />
  <button>remove store</button>
 */

/**
const input = document.querySelector("input");
input.addEventListener("input", event => store.inputValue = event.target.value)
const output = document.querySelector("output");

const clearup = store.connect(output, ({target, listener}) => {
  console.log("func")
  listener.textContent = target.inputValue;
})

// output.remove();
*/

export { makeObservable };

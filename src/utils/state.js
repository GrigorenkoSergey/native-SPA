const makeObservable = obj =>
  new Proxy(obj, {
    set(...args) {
      const [target, key, value] = args;
      console.log("Установка свойства ", key);
      console.log("Значение ", value);

      return Reflect.set(...args);
    },
  });

export { makeObservable };

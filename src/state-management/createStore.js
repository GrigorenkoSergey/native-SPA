import { variables } from "./variables.js";

/**
 * @template {Object<string, any>} T
 * @param {T} obj - простой объект, который нужно проксировать
 * @returns {T} - прокси объекта
 */
const createStore = obj => {
  const observableProps = {};

  const proxy = new Proxy(obj, {
    set(...args) {
      const [target, prop, value] = args;
      const oldValue = target[prop];

      const defaultReturn = Reflect.set(...args);

      const { isDerivingLogicAnalysis, derivingCallback, issuers } = variables;

      if (isDerivingLogicAnalysis) {
        if (Object.hasOwn(observableProps, prop)) {
          // Не стоит одновременно наблюдать за свойством и его устанавливать, т.к.
          // это ведет к бесконечному циклу, поэтому удалим наблюдатель, если он был добавлен.
          observableProps[prop] = observableProps[prop].filter(cb => cb !== derivingCallback);
        }

        return defaultReturn;
      }

      if (Object.hasOwn(observableProps, prop)) {
        const isTrigger = issuers.size === 0;
        let propsInCurrentChain = issuers.get(target);

        if (!propsInCurrentChain) {
          propsInCurrentChain = new Set();
          issuers.set(target, propsInCurrentChain);
        }

        if (propsInCurrentChain.has(prop)) return defaultReturn;

        propsInCurrentChain.add(prop);
        const payload = { store: this, target, prop, value, oldValue };

        if (!isTrigger) {
          observableProps[prop].forEach(cb => cb(payload));

          return defaultReturn;
        }

        try {
          observableProps[prop].forEach(cb => cb(payload));
        } catch (error) {
          console.error(error);

          issuers.clear();
          issuers.set(target, propsInCurrentChain);

          target[prop] = oldValue;
          observableProps[prop].forEach(cb => cb({ ...payload, value: oldValue }));
        }

        issuers.clear();
      }

      return defaultReturn;
    },

    get(...args) {
      const { isDerivingLogicAnalysis, derivingCallback } = variables;

      if (isDerivingLogicAnalysis) {
        const prop = args[1];
        if (!Object.hasOwn(observableProps, prop)) observableProps[prop] = [];

        if (observableProps[prop].at(-1) !== derivingCallback) {
          observableProps[prop].push(derivingCallback);
        }
      }

      return Reflect.get(...args);
    },
  });

  const { observables } = variables;
  observables.set(proxy, observableProps);

  return proxy;
};

export { createStore };

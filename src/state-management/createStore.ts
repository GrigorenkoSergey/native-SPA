import { variables } from "./variables";

type Cb = (payload: unknown) => void;
type StoreObject = Record<string | symbol, unknown>;

const createStore = <T extends StoreObject>(
  /** простой объект, который нужно проксировать */
  obj: T,
): T => {
  const observableProps = Object.create(null);

  const proxy = new Proxy(obj, {
    set(...args) {
      const [target, prop, value] = args;
      const oldValue = target[prop];

      const defaultReturn = Reflect.set(...args);

      const { isDerivingLogicAnalysis, derivingCallback, issuers } = variables;

      if (isDerivingLogicAnalysis) {
        if (prop in observableProps) {
          // Не стоит одновременно наблюдать за свойством и его устанавливать, т.к.
          // это ведет к бесконечному циклу, поэтому удалим наблюдатель, если он был добавлен.
          observableProps[prop] = observableProps[prop].filter((cb: Cb) => cb !== derivingCallback);
        }

        return defaultReturn;
      }

      if (prop in observableProps) {
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
          observableProps[prop].forEach((cb: Cb) => cb(payload));

          return defaultReturn;
        }

        try {
          observableProps[prop].forEach((cb: Cb) => cb(payload));
        } catch (error) {
          console.error(error);

          issuers.clear();
          issuers.set(target, propsInCurrentChain);

          (target as StoreObject)[prop] = oldValue;
          observableProps[prop].forEach((cb: Cb) => cb({ ...payload, value: oldValue }));
        }

        issuers.clear();
      }

      return defaultReturn;
    },

    get(...args) {
      const { isDerivingLogicAnalysis, derivingCallback } = variables;

      if (isDerivingLogicAnalysis) {
        const prop = args[1];
        if (!(prop in observableProps)) observableProps[prop] = [];

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

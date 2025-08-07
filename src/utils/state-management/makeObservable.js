import { variables } from "./variables";

const makeObservable = obj => {
  const observableProps = {};

  const proxy = new Proxy(obj, {
    set(...args) {
      const [target, prop, value] = args;
      const oldValue = target[prop];

      const defaultReturn = Reflect.set(...args);

      const { isDerivingLogicAnalisis, derivingCallback, issuers } = variables;

      if (isDerivingLogicAnalisis) {
        if (prop in observableProps) {
          observableProps[prop] = observableProps[prop].filter(cb => cb !== derivingCallback);
        }

        return defaultReturn;
      }

      if (prop in observableProps) {
        let propsInCurrentChain = issuers.get(target);

        if (!propsInCurrentChain) {
          propsInCurrentChain = new Set();
          issuers.set(target, propsInCurrentChain);
        }

        if (propsInCurrentChain.has(prop)) return defaultReturn;

        propsInCurrentChain.add(prop);

        try {
          observableProps[prop].forEach(cb => cb({ target, prop, value }));
        } catch (error) {
          target[prop] = oldValue;
          observableProps[prop].forEach(cb => cb({ target, prop, value: oldValue }));

          if (propsInCurrentChain.size > 1) throw error;
        }

        propsInCurrentChain.delete(prop);
      }

      return defaultReturn;
    },

    get(...args) {
      const { isDerivingLogicAnalisis, derivingCallback } = variables;

      if (isDerivingLogicAnalisis) {
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

export { makeObservable };

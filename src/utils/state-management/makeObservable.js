import { flowState } from "./flowState";

const makeObservable = obj => {
  const observableProps = {};

  return new Proxy(obj, {
    set(...args) {
      const [target, prop, value] = args;
      const defaultReturn = Reflect.set(...args);

      const { isDerivingLogicAnalisis, derivingCallback, issuers } = flowState;

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
        observableProps[prop].forEach(cb => cb({ target, prop, value }));
        propsInCurrentChain.delete(prop);
      }

      return defaultReturn;
    },

    get(...args) {
      const { isDerivingLogicAnalisis, derivingCallback } = flowState;

      if (isDerivingLogicAnalisis) {
        const prop = args[1];
        if (!(prop in observableProps)) observableProps[prop] = [];

        observableProps[prop].push(derivingCallback);
      }

      return Reflect.get(...args);
    },
  });
};

export { makeObservable };

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
        if (issuers.has(target)) return defaultReturn;

        issuers.add(target);
        observableProps[prop].forEach(cb => cb({ target, prop, value }));
        issuers.delete(target);
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

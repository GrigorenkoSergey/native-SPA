import { variables } from "./variables.js";

export const derive = callback => {
  variables.isDerivingLogicAnalisis = true;
  variables.derivingCallback = callback;

  callback();

  variables.isDerivingLogicAnalisis = false;
  variables.derivingCallback = null;

  const cleanup = () => {
    variables.observables.forEach(observableProps => {
      for (const prop in observableProps) {
        observableProps[prop] = observableProps[prop].filter(cb => cb !== callback);
      }
    });
  };

  return cleanup;
};

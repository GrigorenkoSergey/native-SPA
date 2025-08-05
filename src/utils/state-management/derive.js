import { variables } from "./variables";
// TODO как быть с асинхронщиной?

export const derive = callback => {
  variables.isDerivingLogicAnalisis = true;
  variables.derivingCallback = callback;

  const result = callback();

  variables.isDerivingLogicAnalisis = false;
  variables.derivingCallback = null;

  return result;
};

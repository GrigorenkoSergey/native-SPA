import { flowState } from "./flowState";
// TODO как быть с асинхронщиной?

export const derive = callback => {
  flowState.isDerivingLogicAnalisis = true;
  flowState.derivingCallback = callback;

  const result = callback();

  flowState.isDerivingLogicAnalisis = false;
  flowState.derivingCallback = null;

  return result;
};

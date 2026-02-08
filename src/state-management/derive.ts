import { variables } from "./variables";

type Cb = (obj?: Record<string, unknown>) => void;
/**
 * Функция отслеживания изменений в переданных хранилищах. Значение в хранилище начинает отслеживаться если в callback обращаются к
 * свойству хранилища. Может быть сколько угодно хранилищ для отслеживания.
 * Срабатывает синхронно при изменениях любых значений в отслеживаемых хранилищах.
 **/
export const derive = (
  /** функция которая сработает СРАЗУ же и после изменения значения хранилища, к которому обращаются в callback */
  callback: Cb,
) => {
  variables.isDerivingLogicAnalysis = true;
  variables.derivingCallback = callback;

  callback();

  variables.isDerivingLogicAnalysis = false;
  variables.derivingCallback = null;

  const cleanup = () => {
    variables.observables.forEach(observableProps => {
      for (const prop in observableProps) {
        observableProps[prop] = observableProps[prop].filter((cb: Cb) => cb !== callback);
      }
    });
  };

  return cleanup;
};

import { variables } from "./variables.js";

/**
 * Функция отслеживания изменений в переданных хранилищах. Значение в хранилище начинает отслеживаться если в callback обращаются к
 * свойству хранилища. Может быть сколько угодно хранилищ для отслеживания.
 * Срабатывает синхронно при изменениях любых значений в отслеживаемых хранилищах.
 *
 * @param {Function} callback - функция которая сработает СРАЗУ же и после изменения значения хранилища, к которому обращаются в callback.
 * @returns {Function} cleanup - функция удаления callback
 */
export const derive = callback => {
  variables.isDerivingLogicAnalysis = true;
  variables.derivingCallback = callback;

  callback();

  variables.isDerivingLogicAnalysis = false;
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

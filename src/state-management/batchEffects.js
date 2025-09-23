import { derive } from "./derive.js";

/**
 * Расширенный вариант derive. Выполнение callback откладывается до тех пор, пока не сработает асинхронная функция.
 * Асинхронными функциями могут быть setTimeout, requestAnimationFrame, requestIdleCallback - функции, возвращающие таймер.
 *
 * @param {Function} cb - callback
 * @param {Function} asyncFunc - функция, запущенная асинхронно. По умолчанию requestAnimationFrame. Должна возвращать timerID.
 * @param {Function} cleanup - функция очистки. Аргументом получает timerID, который вернула asyncFunc
 * @returns {Function} - функция очистки callback и удаления таймера
 */
export const batchEffects = (cb, asyncFunc = requestAnimationFrame, cleanup = cancelAnimationFrame) => {
  let timerId = -1;
  let isFirstCall = true;

  const deriveCleanup = derive(() => {
    cleanup(timerId);

    if (isFirstCall) cb();
    else timerId = asyncFunc(cb);

    isFirstCall = false;
  });

  return () => {
    deriveCleanup();
    cleanup(timerId);
  };
};

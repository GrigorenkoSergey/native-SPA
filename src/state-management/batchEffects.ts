import { derive } from "./derive";

type Cb = () => void;

/**
 * Расширенный вариант derive. Выполнение callback откладывается до тех пор, пока не сработает асинхронная функция.
 * Асинхронными функциями могут быть setTimeout, requestAnimationFrame, requestIdleCallback - функции, возвращающие таймер.
 *
 * @param cb - callback
 * @param asyncFunc - функция, запущенная асинхронно. По умолчанию requestAnimationFrame. Должна возвращать timerID.
 * @param cleanup - функция очистки. Аргументом получает timerID, который вернула asyncFunc
 * @returns - функция очистки callback и удаления таймера
 */
export const batchEffects = (
  cb: Cb,
  asyncFunc: (callback: Cb) => number = requestAnimationFrame,
  cleanup: (timerId: number) => void = cancelAnimationFrame,
) => {
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

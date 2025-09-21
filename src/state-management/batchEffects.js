import { derive } from "./derive.js";

export const batchEffects = (cb, asyncFunc = requestAnimationFrame, clearup = cancelAnimationFrame) => {
  let timerId = -1;
  let isFirstCall = true;

  return derive(() => {
    clearup(timerId);

    if (isFirstCall) {
      cb();
      isFirstCall = false;
    }

    timerId = asyncFunc(cb);
  });
};

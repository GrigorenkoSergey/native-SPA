import { derive } from "./derive";

export const batchEffects = (cb, asyncFunc = setTimeout, clearup = clearTimeout) => {
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

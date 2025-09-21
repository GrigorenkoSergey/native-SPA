import { derive } from "./derive.js";

export const batchEffects = (cb, asyncFunc = requestAnimationFrame, clearup = cancelAnimationFrame) => {
  let timerId = -1;
  let isFirstCall = true;

  const deriveCleanup = derive(() => {
    clearup(timerId);

    if (isFirstCall) cb();
    else timerId = asyncFunc(cb);

    isFirstCall = false;
  });

  return () => {
    deriveCleanup();
    clearup(timerId);
  };
};

const listeners = new WeakSet();

/**
 *
 * @param {HTMLElement} element
 * @param {Function} cb
 * @returns {void}
 */
const listenClickOutsideOnce = (element, cb) => {
  if (listeners.has(element)) return;

  listeners.add(element);

  document.addEventListener("click", function listener(event) {
    const isClickOutsideElement = event => !element.contains(event.target);

    if (isClickOutsideElement(event)) {
      cb(element);
      document.removeEventListener("click", listener);
      listeners.delete(element);
    }
  });
};

export { listenClickOutsideOnce };

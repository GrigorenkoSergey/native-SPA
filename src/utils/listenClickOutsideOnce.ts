const listeners = new WeakSet();

const listenClickOutsideOnce = (
  element: HTMLElement,
  cb: (el: HTMLElement) => void,
) => {
  if (listeners.has(element)) return;

  listeners.add(element);

  document.addEventListener("click", function listener(event: MouseEvent) {
    const { target } = event;
    const isClickOutsideElement = () => !element.contains(target as Node);

    if (isClickOutsideElement()) {
      cb(element);
      document.removeEventListener("click", listener);
      listeners.delete(element);
    }
  });
};

export { listenClickOutsideOnce };

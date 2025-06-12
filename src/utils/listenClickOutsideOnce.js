const listenClickOutsideOnce = (element, cb) => {
  document.addEventListener("click", function listener(event) {
    const isClickOutsideElement = event => !element.contains(event.target);

    if (isClickOutsideElement(event)) {
      cb(element);
      document.removeEventListener("click", listener);
    }
  });
};

export { listenClickOutsideOnce };

const propToAttr = prop => prop.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
const attrToProp = attr => attr.replace(/_[A-Z]/g, m => `${m.toUpperCase()}`);

/**
 * @param {String} name
 * @param {HTMLElement} constructor
 */
function initCustomElement(name, constructor) {
  if (!customElements.get(name)) {
    customElements.define(name, constructor);
  }
}

/**
 * When an attribute changes, synchronizes the properties of the element
 * @param {HTMLElement} ctx = this
 * @param {String} name - attribute name
 * @param {String} newValue - new attribute value
 */
function syncPropsWithAttrs(ctx, name, newValue) {
  ctx.constructor.observedAttributes.forEach(attr => {
    if (attr !== name) return;

    const propName = attrToProp(attr);
    const propType = typeof ctx[propName];
    if (propType === "undefined") throw new Error(`External property ${propName} must be defined`);

    let newPropValue = newValue;
    if (propType === "boolean") newPropValue = newValue === "" ? true : false;
    else if (propType === "number") newPropValue = Number(newValue);

    if (ctx[propName] !== newPropValue) ctx[propName] = newPropValue;
  });
}

/**
 *
 * @param {HTMLElement} ctx
 * @param {String} attrName
 */
function syncAttrsPropsState(ctx, attrName) {
  const { _state } = ctx;
  if (!_state) throw new Error("_state property is required!");

  ctx._isInnerAttrSet = !attrName;
  const shouldSetProp = ctx._isInnerAttrSet;

  ctx.constructor.observedAttributes.forEach(attr => {
    const propName = attrToProp(attr);
    if (shouldSetProp) ctx[propName] = _state[propName];
    else _state[propName] = ctx[propName];
  });

  ctx._isInnerAttrSet = false;
}

/**
 * For each property creates a protected and synchronizes attributes with it
 * To find a strategy (infer type), the property must be previously defined
 * @param {HTMLElement} ctx = this
 * @param  {String[]} props Element properties that must be synchronized with attributes
 */
function applyGetSet(ctx, ...props) {
  props.forEach(prop => {
    const hiddenKey = `_${prop}`;
    ctx[hiddenKey] = ctx[prop];

    const attrName = propToAttr(prop);

    Object.defineProperty(ctx, prop, {
      get() {
        return ctx[hiddenKey];
      },

      set(value) {
        ctx[hiddenKey] = value;
        if (typeof value === "boolean") setBooleanAttrIfNeeded(ctx, attrName, value);
        else setNonBooleanAttrIfNeeded(ctx, attrName, value);
      },
    });
  });
}

/**
 *
 * @param {HTMLElement} ctx
 * @param {String} attrName
 * @param {Boolean} value
 */
function setNonBooleanAttrIfNeeded(ctx, attrName, value) {
  const attrValue = ctx.getAttribute(attrName);
  if (attrValue !== String(value)) ctx.setAttribute(attrName, value);
}

/**
 *
 * @param {HTMLElement} ctx
 * @param {String} attrName
 * @param {String|Number} value
 */
function setBooleanAttrIfNeeded(ctx, attrName, value) {
  const attrValue = ctx.hasAttribute(attrName);
  if (attrValue === value) return;

  if (value) ctx.setAttribute(attrName, "");
  else ctx.removeAttribute(attrName);
}

export { initCustomElement, syncAttrsPropsState, syncPropsWithAttrs, applyGetSet };

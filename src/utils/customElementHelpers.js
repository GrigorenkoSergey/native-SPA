const propToAttr = prop => prop.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
const attrToProp = attr => attr.replace(/_[A-Z]/g, m => `${m.toUpperCase()}`);

/**
 * @param {String} name
 * @param {HTMLElement} constructor
 */
export function initCustomElement(name, constructor) {
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
export function syncPropsWithAttrs(ctx, name, newValue) {
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
 * Синхронизирует свойства, соответстующие наблюдаемым атрибутам и внутреннее состояние.
 * Если аргументом передано имя атрибута - значит изменение пришло из attributeChangeCallback,
 * то есть изменение вызвал какой-либо внейшний код (програмное изменение атрибута или свойства)
 * @param {HTMLElement} ctx
 * @param {String} attrName
 */
export function syncAttrPropsWithState(ctx, attrName) {
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
export function applyGetSet(ctx, ...props) {
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

/**
 * Вставка в компонент ссылки на общий сброс стилей + добавление тега style, в который будет добавлены
 * стили, которые мы импортировали как строку. Компонент должен использовать shadow DOM.
 * @param {HTMLElement} ctx
 * @param {String} initialStyles - стили, которые импортируем как строку и которые будут вставлены после reset.css
 * @param {HTMLElement} customTemplate -
 */
export function attachStyles(ctx, initialStyles, customTemplate) {
  const resultStyles = [];
  const reset = document.getElementById("reset-css");
  if (reset) resultStyles.push(reset.cloneNode(true));

  const style = document.createElement("style");
  style.textContent = initialStyles;
  resultStyles.push(style);

  if (customTemplate) {
    const templateContent = customTemplate.content;
    const customStyles = templateContent.querySelector("style,link[rel=stylesheet]");
    if (customStyles) resultStyles.push(customStyles.cloneNode(true));
  }

  ctx.shadowRoot.prepend(...resultStyles);
}

/**
 * Ищет по ID с учетом возможного нахождения в shadow tree выше по дереву
 * @param {String} id - ID по которому нужно найти элемент
 * @param {HTMLElement} startElement - элемент, от которого начинаем поиск вверх по дереву (сначала ищем в нем)
 * @returns {HTML}
 */
export function findById(id, startElement) {
  let root = startElement;
  let element = root.querySelector(`#${id}`);

  while (!element) {
    root = root.getRootNode();
    if (root instanceof ShadowRoot) root = root.host;

    element = root.querySelector(`#${id}`);
    if (root === document) return element;
  }

  return element;
}

/**
 * Ищет в шаблоне элементы с определенным ID и заменяет ими элементы с тем же ID в shadowDom
 * @param {ShadowRoot} shadowRoot
 * @param {HTMLTemplateElement} customTemplate
 * @returns
 */
export function replaceToCustomIds(shadowRoot, customTemplate) {
  if (!customTemplate) return;

  const templateIds = Array.from(shadowRoot.querySelectorAll("[id]"), elem => elem.id);
  if (templateIds.length === 0) return;

  for (const id of templateIds) {
    const elementToReplace = customTemplate.content.getElementById(id);
    if (elementToReplace) {
      shadowRoot.getElementById(id).replaceWith(elementToReplace);
    }
  }
}

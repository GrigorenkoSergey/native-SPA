const propToAttr = (prop: string) => prop.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
const attrToProp = (attr: string) => attr.replace(/_[A-Z]/g, m => `${m.toUpperCase()}`);

/**
 * @param {String} name
 * @param {HTMLElement} constructor
 */
export function initCustomElement(name: string, constructor: CustomElementConstructor) {
  if (!customElements.get(name)) {
    customElements.define(name, constructor);
  }
}

interface CustomElementConstructor {
  new(): CustomElementInstance;
  observedAttributes?: string[],
}

interface CustomElementInstance extends HTMLElement {
  [p: string]: unknown;

  constructor: CustomElementConstructor;
  _state?: {
    [stateProp: string]: unknown;
  },
}

/**
 * When an attribute changes, synchronizes the properties of the element
 * @param ctx = this
 * @param name - attribute name
 * @param newValue - new attribute value
 */
export function syncPropsWithAttrs(
  ctx: CustomElementInstance,
  name: string,
  newValue: unknown,
) {
  ctx.constructor.observedAttributes?.forEach(attr => {
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
export function syncAttrPropsWithState(ctx: CustomElementInstance, attrName: string) {
  const { _state } = ctx;
  if (!_state) throw new Error("_state property is required!");

  ctx._isInnerAttrSet = !attrName;
  const shouldSetProp = ctx._isInnerAttrSet;

  ctx.constructor.observedAttributes?.forEach(attr => {
    const propName = attrToProp(attr);
    if (shouldSetProp) ctx[propName] = _state[propName];
    else _state[propName] = ctx[propName];
  });

  ctx._isInnerAttrSet = false;
}

/**
 * For each property creates a protected and synchronizes attributes with it
 * To find a strategy (infer type), the property must be previously defined
 **/
export function applyGetSet(
  /** this */
  ctx: CustomElementInstance,
  /** Element properties that must be synchronized with attributes */
  ...props: string[]
) {
  props.forEach(prop => {
    const hiddenKey = `#${prop}`;
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

function setNonBooleanAttrIfNeeded(
  ctx: CustomElementInstance,
  attrName: string,
  value: string,
) {
  const attrValue = ctx.getAttribute(attrName);
  if (attrValue !== String(value)) ctx.setAttribute(attrName, value);
}

function setBooleanAttrIfNeeded(
  ctx: CustomElementInstance,
  attrName: string,
  value: string | number | boolean,
) {
  const attrValue = ctx.hasAttribute(attrName);
  if (attrValue === value) return;

  if (value) ctx.setAttribute(attrName, "");
  else ctx.removeAttribute(attrName);
}

/**
 * Вставка в компонент ссылки на общий сброс стилей + добавление тега style, в который будет добавлены
 * стили, которые мы импортировали как строку. Компонент должен использовать shadow DOM.
 **/
export function attachStyles(
  ctx: HTMLElement,
  /** Стили, которые импортируем как строку и которые будут вставлены после shadow-reset.css */
  initialStyles: string,
  customTemplate?: HTMLTemplateElement | null,
) {
  const resultStyles = [];
  const reset = document.getElementById("shadow-reset");
  if (reset) resultStyles.push(reset.cloneNode(true));

  const style = document.createElement("style");
  style.textContent = initialStyles;
  resultStyles.push(style);

  if (customTemplate) {
    const templateContent = customTemplate.content;
    const customStyles = templateContent.querySelector("style,link[rel=stylesheet]");
    if (customStyles) resultStyles.push(customStyles.cloneNode(true));
  }

  ctx.shadowRoot?.prepend(...resultStyles);
}

/** Альтернативная реализация привязки стилей
 **/
export function attachStyles2(ctx: HTMLElement, nodes: (HTMLLinkElement | HTMLStyleElement)[]) {
  const resultStyles = [];
  const reset = document.getElementById("shadow-reset");
  if (reset) resultStyles.push(reset.cloneNode(true));

  resultStyles.push(...nodes.map(elem => elem.cloneNode(true)));
  ctx.shadowRoot?.prepend(...resultStyles);
}

/**
 * Ищет по ID с учетом возможного нахождения в shadow tree выше по дереву
 */
export function findById(
  id: string,
  startElement: HTMLElement,
) {
  let root: Node | Document | ShadowRoot = startElement;
  let element = (root as HTMLElement).querySelector(`#${id}`);

  while (!element) {
    root = root.getRootNode();
    if (root instanceof ShadowRoot) root = root.host;

    if (root instanceof HTMLElement || root instanceof Document) {
      element = root.querySelector(`#${id}`);
    }
    if (root === document) return element;
  }

  return element;
}

/**
 * Ищет в шаблоне элементы с определенным ID и заменяет ими элементы с тем же ID в shadowDom
 */
export function replaceToCustomIds(
  shadowRoot: ShadowRoot,
  customTemplate: HTMLTemplateElement,
) {
  const templateIds = Array.from(shadowRoot.querySelectorAll("[id]"), elem => elem.id);
  if (templateIds.length === 0) return;

  for (const id of templateIds) {
    const elementToReplace = customTemplate.content.getElementById(id);
    if (elementToReplace) {
      shadowRoot.getElementById(id)?.replaceWith(elementToReplace);
    }
  }
}

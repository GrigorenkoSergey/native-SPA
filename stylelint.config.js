/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard"],
  customSyntax: "postcss-scss",
  rules: {
    // Здесь можно будет добавлять или изменять правила
    "selector-class-pattern": null,
    "no-descending-specificity": null,
    "value-keyword-case": ["lower", { ignoreKeywords: ["currentColor"] }],
  },
};

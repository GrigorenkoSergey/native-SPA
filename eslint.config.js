import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["playwright-report/**"],
  },

  // Apply recommended configs for JS and TS
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Global rules for all files (JS, TS, CJS)
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/indent": ["error", 2],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/no-extra-semi": "error",
      "@stylistic/no-multi-spaces": "error",
      "@stylistic/keyword-spacing": ["error", { "before": true, "after": true }],
      "@stylistic/function-call-spacing": ["error", "never"],
      "@stylistic/space-before-blocks": "error",
      "@stylistic/space-infix-ops": "error",
      "@stylistic/operator-linebreak": ["error", "after"],
      "@stylistic/no-multiple-empty-lines": ["error", { "max": 1 }],
    },
  },

  // Language options for browser files
  {
    files: ["**/*.{js,mjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Specific overrides for CJS files
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

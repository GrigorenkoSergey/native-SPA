import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default defineConfig([
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

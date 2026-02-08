import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
]);

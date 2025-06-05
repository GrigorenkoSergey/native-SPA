import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import prettier from 'eslint-config-prettier';


export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: {
      js,
      prettier,
    },
    extends: [
      "js/recommended",
      "plugin:prettier/recommended",
    ],
    rules: {
      "prettier/prettier": "error",
    }
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.browser
    }
  },
]);

/* eslint-disable no-undef */
import { defineConfig } from "vite";
import path from "path";

const isStorybook = Boolean(process.env.IS_STORYBOOK);

export default defineConfig({
  root: path.resolve(__dirname, isStorybook ? "src/.storybook" : "src"),

  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, isStorybook ? "src/.storybook/index.html" : "src/index.html"),
      },
    },
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});

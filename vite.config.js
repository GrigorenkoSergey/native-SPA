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
        "page-1": path.resolve(__dirname, "src/pages/page-1/template.html"),
        "page-2": path.resolve(__dirname, "src/pages/page-2/template.html"),
      },
      output: {
        entryFileNames: chunkInfo => {
          const name = chunkInfo.name;
          return name === "main" ? `[name].[hash].js` : `pages/${name}/index.[hash].js`;
        },
      },
    },
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});

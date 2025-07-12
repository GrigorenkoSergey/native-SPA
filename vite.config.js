/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import fs from "fs";
import path from "path";

const isStorybook = Boolean(process.env.IS_STORYBOOK);

const pagesDirName = "pages";
const pathToPages = path.resolve(__dirname, `src/${pagesDirName}/`);
const pageDirs = fs
  .readdirSync(pathToPages, { withFileTypes: true })
  .filter(x => x.isDirectory())
  .map(dir => dir.name);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    root: isStorybook ? "src/.storybook" : "src",
    base: isStorybook ? "/" : env.VITE_BASE_URL,
    envDir: "..",

    build: {
      outDir: "../dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, isStorybook ? "src/.storybook/index.html" : "src/index.html"),
          ...Object.fromEntries(pageDirs.map(name => [name, path.resolve(pathToPages, `${name}/template.html`)])),
        },
        output: {
          entryFileNames: chunkInfo => {
            const name = chunkInfo.name;
            return name === "main" ? `[name].[hash].js` : `${pagesDirName}/${name}/index.[hash].js`;
          },
        },
      },
    },
  };
});

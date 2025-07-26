/* eslint-disable no-undef */
import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

const pagesDirName = "pages";
const pathToPages = path.resolve(__dirname, `src/${pagesDirName}/`);
const pageDirs = fs
  .readdirSync(pathToPages, { withFileTypes: true })
  .filter(x => x.isDirectory())
  .map(dir => dir.name);

export default defineConfig({
  root: "src",

  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Пути к файлам должны быть абсолютными или относительными `root`
        main: path.resolve(__dirname, "src/index.html"),
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
});

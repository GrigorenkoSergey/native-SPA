/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import fs from "fs";
import path from "path";

const commonTemplate = fs.readFileSync(path.resolve(__dirname, "src/index-template.html"), "utf-8");

const isStorybook = Boolean(process.env.IS_STORYBOOK);

const pagesDirName = "pages";
const pathToPages = path.resolve(__dirname, `src/${pagesDirName}/`);

const getPageInputs = (dir, root) => {
  const entries = {};
  const dirents = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      const templatePath = path.join(fullPath, "index.html");
      if (fs.existsSync(templatePath)) {
        const relativePath = path.relative(root, fullPath);
        entries[relativePath] = templatePath;
      }
      Object.assign(entries, getPageInputs(fullPath, root));
    }
  }

  return entries;
};

const pageInputs = getPageInputs(pathToPages, pathToPages);

const htmlPlugin = () => {
  return {
    name: "apply-common-html-part",
    transformIndexHtml(html) {
      return commonTemplate.replace("{{content}}", html);
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    root: isStorybook ? "src/.storybook" : "src",
    base: isStorybook ? "/" : env.VITE_BASE_URL,
    envDir: "..",
    plugins: [htmlPlugin()],

    build: {
      outDir: "../dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, isStorybook ? "src/.storybook/index.html" : "src/index.html"),
          ...pageInputs,
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

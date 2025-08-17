/* eslint-disable no-undef */
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const isStorybook = Boolean(process.env.IS_STORYBOOK);
const pagesDirName = "pages";
const pathToPages = path.resolve(__dirname, `src/${pagesDirName}/`);
const commonTemplate = fs.readFileSync(path.resolve(__dirname, "src/page-template.html"), "utf-8");

// Функция для получения входных точек (аналогично Vite)
const getPageInputs = (dir, root) => {
  const entries = {};
  const htmlPlugins = [];
  const dirents = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      const templatePath = path.join(fullPath, "index.html");

      if (fs.existsSync(templatePath)) {
        const relativePath = path.relative(root, fullPath);
        const entryName = relativePath.replace(/\\/g, "/");

        // Создаем entry point для каждой страницы
        entries[entryName] = path.join(fullPath, "index.js");

        // Создаем HTML плагин для каждой страницы
        htmlPlugins.push(
          new HtmlWebpackPlugin({
            filename: `${entryName}/index.html`,
            template: templatePath,
            chunks: [entryName],
            minify: true,
            templateParameters: {
              base: process.env.BASE_URL + pagesDirName + "/",
              content: fs.readFileSync(templatePath, "utf-8"),
            },
          }),
        );
      }
      const subDirResults = getPageInputs(fullPath, root);
      Object.assign(entries, subDirResults.entries);
      htmlPlugins.push(...subDirResults.htmlPlugins);
    }
  }

  return { entries, htmlPlugins };
};

// const { entries, htmlPlugins } = getPageInputs(pathToPages, pathToPages);

module.exports = env => {
  const base = process.env.BASE_URL + pagesDirName + "/";

  return {
    mode: env.mode || "development",
    entry: {
      main: "./src/main.js",

      // ...entries,
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: chunkData => {
        const name = chunkData.chunk.name;
        return name === "main" ? "[name].[contenthash].js" : `${pagesDirName}/${name}/index.[contenthash].js`;
      },
      publicPath: base,
    },
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      hot: true,
      historyApiFallback: {
        rewrites: [
          { from: /./, to: `${base}index.html` }, // Все запросы → index.html
        ],
      },
      open: [base],
    },
    module: {
      rules: [
        {
          test: /index\.html$/i,
          loader: "html-loader",
          options: {
            preprocessor: content => {
              const params = { base, content };
              return commonTemplate.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
                console.log("match", match);
                console.log("params", params);
                return params[variable] || (console.log("var", variable), "foo");
              });
            },
          },
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: "./src/index.html",
        chunks: ["main"],
      }),
      // ...htmlPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
};

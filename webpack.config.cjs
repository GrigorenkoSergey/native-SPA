/* eslint-disable no-undef */
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const pagesDirName = "pages";
const pathToPages = path.resolve(__dirname, `src/${pagesDirName}/`);
const commonTemplate = fs.readFileSync(path.resolve(__dirname, "src/page-template.html"), "utf-8");

const getPageInputs = (dir, root) => {
  const entries = {};
  const dirents = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      const templatePath = path.join(fullPath, "index.js");
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

const storesDir = path.resolve(__dirname, "src/stores");
const storeFiles = fs
  .readdirSync(storesDir)
  .filter(file => fs.statSync(path.join(storesDir, file)).isFile() && file.endsWith(".js"));

const storeInputs = storeFiles.reduce((acc, file) => {
  const key = file.replace(".js", "");
  acc[key] = {
    import: `${storesDir}/${file}`,
    dependOn: "state-management",
  };

  return acc;
}, {});

module.exports = env => {
  const base = process.env.BASE_URL;

  return {
    mode: env.mode || "development",
    devtool: env.mode === "production" ? false : "source-map",
    entry: {
      main: "./src/main.js", // здесь подключим основные скрипты, роутинг, например
      "state-management": "./src/utils/state-management/index.js",
      ...storeInputs,
      ...pageInputs,
    },
    externals: {
      store: `module ${base}pages/store/index.js`,
      "state-management": `module ${base}pages/state-management/index.js`,
    },
    externalsType: "module",
    experiments: {
      // работает только совместно со строкой library + scriptLoading
      outputModule: true,
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: chunkData => {
        const name = chunkData.chunk.name || "internal";
        if (name === "internal") return "[name].[contenthash].js";
        return name === "main" ? "[name].js" : `${pagesDirName}/${name}/index.js`;
      },
      publicPath: base,
      library: {
        // работает только совместно со строкой experiments + scriptLoading
        type: "module",
      },
      clean: true,
    },
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
        publicPath: base,
      },
      hot: true,
      port: 8080,
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
                return params[variable] || match;
              });
            },
          },
        },
        {
          test: /\.(css|scss)$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: { modules: { auto: true } },
            },
            "postcss-loader",
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/,
          type: "asset/resource",
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: chunkData => {
          const name = chunkData.chunk.name;
          return name === "main" ? "[name].[contenthash].css" : `${pagesDirName}/${name}/index.[contenthash].css`;
        },
      }),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: "./src/index.html",
        chunks: ["main"],
        scriptLoading: "module",
      }),
      ...Object.entries(pageInputs).map(
        ([pageChunk, fullPath]) =>
          new HtmlWebpackPlugin({
            // удалим все, что идет до src
            filename: fullPath.replace(/.+?src\/(.+)/, (m, p) => p.replace(".js", ".html")),
            template: fullPath.replace(".js", ".html"),
            chunks: ["main", pageChunk],
            // работает только совместно со строкой library + experiments
            scriptLoading: "module",
          }),
      ),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
};

/* eslint-disable no-undef */
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

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

module.exports = env => {
  const base = process.env.BASE_URL;

  return {
    mode: env.mode || "development",
    devtool: env.mode === "production" ? false : "source-map",
    entry: {
      main: "./src/main.js",
      ...pageInputs,
      "state-management": "./src/utils/state-management/index.js",
      stores: {
        import: "./src/stores/store.js",
        dependOn: "state-management",
      },
    },
    externals: {
      store: "module /native-SPA/pages/stores/index.js",
      "state-management": "module /native-SPA/pages/state-management/index.js",
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
        // return name === "main" ? "[name].[contenthash].js" : `${pagesDirName}/${name}/index.[contenthash].js`;
        if (name === "internal") return "[name].[contenthash].js";
        return name === "main" ? "[name].js" : `${pagesDirName}/${name}/index.js`;
      },
      publicPath: base,
      library: {
        // работает только совместно со строкой experiments + scriptLoading
        type: "module",
      },
    },
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      hot: true,
      port: 8080,
      historyApiFallback: {
        verbose: true,
        rewrites: [
          {
            from: new RegExp(base + "(.+)"),
            to: context => `${base}pages/${context.match[1].replace(/index\.html$/, "")}index.html`,
          },
        ],
      },
      open: [`${base}pages/page-1/`],
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
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [["@babel/preset-env"]],
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
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: chunkData => {
          const name = chunkData.chunk.name;
          return name === "main" ? "[name].[contenthash].css" : `${pagesDirName}/${name}/index.[contenthash].css`;
        },
      }),
      ...Object.entries(pageInputs).map(
        ([pageChunk, fullPath]) =>
          new HtmlWebpackPlugin({
            // удалим все, что идет до src
            filename: fullPath.replace(/.+?src\/(.+)/, (m, p) => p.replace(".js", ".html")),
            template: fullPath.replace(".js", ".html"),
            chunks: ["main", pageChunk, ...(pageChunk === "page-1" ? ["stores", "state-management"] : [])],
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
    optimization: {
      minimize: false, // Отключаем минификацию
      concatenateModules: false, // Отключаем объединение модулей
      usedExports: false, // Отключаем tree shaking
      splitChunks: false, // Полностью отключаем разделение чанков
    },
  };
};

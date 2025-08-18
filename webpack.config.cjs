/* eslint-disable no-undef */
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
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
  const base = process.env.BASE_URL + pagesDirName + "/";

  return {
    mode: env.mode || "development",
    entry: {
      main: "./src/main.js",
      ...pageInputs,
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
        verbose: true,
        rewrites: [
          {
            from: new RegExp(base + "(.+)"),
            to: context => `${base}pages/${context.match[1]}index.html`,
          },
        ],
      },
      open: [`${base}page-1/`],
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
              presets: ["@babel/preset-env"],
            },
          },
        },
        {
          test: /\.(css|scss)$/,
          use: [
            "style-loader",
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
      ...Object.entries(pageInputs).map(
        ([pageChunk, fullPath]) =>
          new HtmlWebpackPlugin({
            // удалим все, что идет до src
            filename: fullPath.replace(/.+?src\/(.+)/, (m, p) => p.replace(".js", ".html")),
            template: fullPath.replace(".js", ".html"),
            chunks: ["main", pageChunk],
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

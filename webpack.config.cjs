/* eslint-disable no-undef */
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const pagesDirName = "pages";
const commonTemplate = fs.readFileSync(path.resolve(__dirname, "src/page-template.html"), "utf-8");

module.exports = env => {
  const base = process.env.BASE_URL + pagesDirName + "/";

  return {
    mode: env.mode || "development",
    entry: {
      // main: "./src/main.js",
      "page-1": "./src/pages/page-1/index.js",
      "page-2": "./src/pages/page-2/index.js",

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
        // verbose: true,
        rewrites: [
          {
            from: /^\/native-SPA\/pages\/([a-zA-Z0-9-]+)\/?$/,
            to: context => `/native-SPA/pages/pages/${context.match[1]}/index.html`,
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
      // new HtmlWebpackPlugin({
      //   filename: "index.html",
      //   template: "./src/index.html",
      //   chunks: ["main"],
      // }),
      new HtmlWebpackPlugin({
        filename: "pages/page-1/index.html",
        template: "./src/pages/page-1/index.html",
        chunks: ["page-1"],
      }),
      new HtmlWebpackPlugin({
        filename: "pages/page-2/index.html",
        template: "./src/pages/page-2/index.html",
        chunks: ["page-2"],
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

/* eslint-disable no-undef */
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");

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
  const manifestPath = path.resolve(__dirname, "dist/manifest.json");

  let manifest = {};
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    console.log("Can't find manifest file. It's ok for the first build.");
  }

  return {
    mode: env.mode || "development",
    devtool: env.mode === "production" ? false : "source-map",
    entry: {
      main: "./src/main.js", // здесь подключим основные скрипты, роутинг, например
      "state-management": "./src/utils/state-management/index.js",
      stores: {
        import: "./src/stores/store.js",
        dependOn: "state-management",
      },
      ...pageInputs,
    },
    externals: ({ request }, callback) => {
      if (Object.keys(manifest).length > 0) {
        const stateManagementPath = manifest["state-management.js"];
        const storePath = manifest["stores.js"];

        if (request === "state-management" && stateManagementPath) {
          return callback(null, `module ${stateManagementPath}`);
        }
        if (request === "store" && storePath) {
          return callback(null, `module ${storePath}`);
        }
      }
      callback();
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
        const pageChunkNames = Object.keys(pageInputs);

        if (name === "internal") return "[name].[contenthash].js";

        if (pageChunkNames.includes(name)) {
          return `${pagesDirName}/${name}/index.[contenthash].js`;
        }

        return `[name].[contenthash].js`;
      },
      publicPath: base,
      library: {
        // работает только совместно со строкой experiments + scriptLoading
        type: "module",
      },
      clean: {
        keep: /manifest\.json$/,
      },
    },
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
        publicPath: base,
      },
      hot: true,
      port: 8080,
      historyApiFallback: {
        verbose: true,
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
      new WebpackManifestPlugin({
        fileName: manifestPath,
        publicPath: base,
      }),
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
        store: path.resolve(__dirname, "src/stores/store.js"),
        "state-management": path.resolve(__dirname, "src/utils/state-management/index.js"),
      },
    },
  };
};

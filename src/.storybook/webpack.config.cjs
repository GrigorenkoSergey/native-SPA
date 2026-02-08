 
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const pagesDirName = "pages";
const pathToPages = path.resolve(__dirname, `${pagesDirName}/`);
const commonTemplate = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");

const getPageInputs = (dir, root) => {
  const entries = {};
  const dirents = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      const templatePath = path.join(fullPath, "index.ts");
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
  const base = "/";
  const isProd = env.mode === "production";
  const buildKey = isProd ? Number(new Date()) : 0;

  return {
    mode: env.mode || "development",
    devtool: isProd ? false : "source-map",
    entry: {
      main: path.resolve(__dirname, "./main.ts"),
      ...pageInputs,
    },
    experiments: {
      // работает только совместно со строкой library + scriptLoading
      outputModule: true,
    },
    output: {
      path: path.resolve(__dirname, "../../dist-storybook"),
      filename: chunkData => {
        const name = chunkData.chunk.name || "internal";
        if (name in pageInputs) return `${pagesDirName}/${name}/index.${buildKey}.js`;

        return `${name}.js`;
      },
      publicPath: base,
      library: {
        // работает только совместно со строкой experiments + scriptLoading
        type: "module",
      },
      clean: true,
    },
    devServer: {
      hot: true,
      port: 8082,
      open: {
        target: `${base}pages/custom-autocomplete/`,
        // app: { name: "firefox" },
      },
      watchFiles: ["src/**/*.html"],
    },
    module: {
      rules: [
        {
          test: /index\.html$/i,
          loader: "html-loader",
          options: {
            sources: {
              urlFilter: (attribute, value) => {
                if (value === "./reset.css") return false;
                return true;
              },
            },
            preprocessor: content => {
              const params = { base, content };
              return commonTemplate.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
                return params[variable] || match;
              });
            },
          },
        },
        {
          test: /template\.html$/i,
          loader: "html-loader",
        },
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.(css|scss)$/,
          resourceQuery: /raw/,
          type: "asset/source",
        },
        {
          test: /\.(css|scss)$/,
          resourceQuery: { not: [/raw/] },
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
      new CopyPlugin({
        patterns: [
          { from: "src/images", to: "images" },
          { from: "src/reset.css", to: "reset.css" },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: chunkData => {
          const name = chunkData.chunk.name;
          return name === "main" ? "[name].css" : `${pagesDirName}/${name}/index.css`;
        },
      }),
      ...Object.entries(pageInputs).map(([pageChunk, fullPath]) => {
        return new HtmlWebpackPlugin({
          // удалим все, что идет до storybook
          filename: fullPath.replace(/.+?.storybook\/(.+)/, (m, p) => p.replace(/\.(js|ts)/, ".html")),
          template: fullPath.replace(/\.(js|ts)/, ".html"),
          chunks: ["main", pageChunk],
          // работает только совместно со строкой library + experiments
          scriptLoading: "module",
        });
      }),
    ],
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "@": path.resolve(__dirname, ".."),
      },
    },
  };
};

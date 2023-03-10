const path = require("path");
const webpack = require("webpack");
const zopfli = require("@gfx/zopfli");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

const webpackMode = process.env.NODE_ENV || "development";

module.exports = {
  mode: webpackMode,
  entry: {
    main: "./src/main.js",
  },
  output: {
    path: path.resolve("./dist"),
    filename: "[name].min.js",
  },
  // es5로 빌드 해야 할 경우 주석 제거
  // 단, 이거 설정하면 webpack-dev-server 3번대 버전에서 live reloading 동작 안함
  // target: ['web', 'es5'],
  devServer: {
    liveReload: true,
  },
  optimization: {
    minimizer:
      webpackMode === "production"
        ? [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true,
                },
              },
            }),
          ]
        : [],
    splitChunks: {
      chunks: "all",
    },
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg|webp|glb|gltf|tif|)$/i,
        use: {
          loader: "file-loader",
          options: {
            name: "[name].[contenthash].[ext]",
          },
        },
      },
      {
        test: /\.(glsl|vert|frag)$/,
        loader: "threejs-glsl-loader",
        // Default values (can be omitted)
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      minify:
        process.env.NODE_ENV === "production"
          ? {
              collapseWhitespace: true,
              removeComments: true,
            }
          : false,
    }),
    new CleanWebpackPlugin(),
    // CopyWebpackPlugin: 그대로 복사할 파일들을 설정하는 플러그인
    // 아래 patterns에 설정한 파일/폴더는 빌드 시 dist 폴더에 자동으로 생성됩니다.
    // patterns에 설정한 경로에 해당 파일이 없으면 에러가 발생합니다.
    // 사용하는 파일이나 폴더 이름이 다르다면 변경해주세요.
    // 그대로 사용할 파일들이 없다면 CopyWebpackPlugin을 통째로 주석 처리 해주세요.
    new CopyWebpackPlugin({
      patterns: [
        { from: "./src/reset.css", to: "./reset.css" },
        { from: "./src/asset", to: "./asset" },
      ],
    }),
    new CompressionPlugin({
      filename: "[path][base].gz",
      test: /\.js$|\.css$|\.html$/,
      algorithm: "gzip",
    }),
  ],
};

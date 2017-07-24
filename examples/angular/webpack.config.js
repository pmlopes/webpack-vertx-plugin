// webpack.config.js
const path = require('path');
const VertxPlugin = require('../../plugin');

const backend = {

    entry: path.resolve(__dirname, 'src/server/index.js'),

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },

    plugins: [
        new VertxPlugin({
            groupId: 'com.example',
            artifactId: 'com.example',
            version: '1.0.0',
            name: 'example',
            javaDependencies: {
                'io.vertx:vertx-lang-js': '3.4.2',
                'io.vertx:vertx-web': '3.4.2'
            }
        })
    ]
};

const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const ProvidePlugin = require("webpack/lib/ProvidePlugin");

const appDir = path.resolve(__dirname, "src/client");

const frontend = {

    entry: {
        polyfills: path.resolve(__dirname, "src/client/polyfills.ts"),
        app: path.resolve(__dirname, "src/client/main.ts"),
        vendor: path.resolve(__dirname, "src/client/vendor.ts")
    },
    resolve: {
        extensions: [".js", ".ts", ".css"]
    },
    output: {
        path: path.resolve(__dirname, "dist/webroot"),
        filename: "[name].js"
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader"
            },
            {
                test: /\.ts$/,
                enforce: "pre",
                loader: "tslint-loader"
            },
            {
                // component templates
                test: /\.html$/,
                loader: "html-loader"
            }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src/client/index.html"),
            inject: "body"
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: ["app", "vendor", "polyfills"]
        }),
        new ProvidePlugin({
            jQuery: "jquery",
            $: "jquery",
            jquery: "jquery",
            "Tether": "tether",
            "window.Tether": "tether",
            Tooltip: "exports-loader?Tooltip!bootstrap/js/dist/tooltip"
        })
    ],
    devtool: "source-map",
};

module.exports = [backend, frontend];

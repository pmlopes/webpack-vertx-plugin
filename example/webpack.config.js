// webpack.config.js
var path = require('path');
var VertxPlugin = require('../plugin');

var backend = {

    entry: path.resolve(__dirname, 'src/server/index.js'),

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },

    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
        ]
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

var frontend = {

    entry: path.resolve(__dirname, 'src/client/index.js'),

    devtool: 'source-map',

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/webroot')
    },

    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
        ]
    }
};

module.exports = [backend, frontend];

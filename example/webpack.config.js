// webpack.config.js
var path = require('path');
var _package = require('./package.json');
var VertxPlugin = require('../plugin');

module.exports = {
    entry: path.resolve(__dirname, 'src/index.js'),

    output: {
        filename: _package.mainVerticle,
        path: __dirname + '/build'
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
                'io.vertx:vertx-lang-js': '3.4.2'
            }
        })
    ]
};
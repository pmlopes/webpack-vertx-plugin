[![npm version](https://badge.fury.io/js/webpack-vertx-plugin.svg)](https://badge.fury.io/js/webpack-vertx-plugin)
[![npm](https://img.shields.io/npm/dm/webpack-vertx-plugin.svg)]()

# Webpack Vertx Plugin

This plugin allows you to extract nashorn modules to your node_modules work directory and on compilation success package
your application as a runnable jar.
 
## WARNING

This plugin expects that your already have Apache Maven installed in your system since will interact with it in order to
perform its tasks.

## Installation

`npm install --save-dev webpack-vertx-plugin`

## Setup
In `webpack.config.js`:

```js
const WebpackVertxPlugin = require('webpack-vertx-plugin');

module.exports = {
  ...
  ...
  plugins: [
    new WebpackVertxPlugin({extractOnly: false, maven: 'mvn'})
  ],
  ...
}
```

## Example

Insert into your webpack.config.js:

```js
const WebpackVertxPlugin = require('webpack-vertx-plugin');
const path = require('path');

var plugins = [];

plugins.push(new WebpackVertxPlugin());

var config = {
  entry: {
    app: path.resolve(__dirname, 'src/app.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'), // regular webpack
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'src') // dev server
  },
  plugins: plugins,
  module: {
    loaders: [
      {test: /\.js$/, loaders: 'babel'},
      {test: /\.scss$/, loader: 'style!css!scss?'},
      {test: /\.html$/, loader: 'html-loader'}
    ]
  }
}

module.exports = config;

```

### Config
* `maven`: string with the system maven path. **Default: 'mvn'**
* `extractOnly`: boolean to only extract resources to `node_modules` (do not execute `mvn package` in the end of the build). **Default: false**
* `verbose`: boolean to display the maven output. **Default: false**
* `watchPattern`: a ant pattern to pass to vertx when watching for file changes, **Default: src/main/resources/\*\*/\***
* `redeploy`: boolean instructing to redeploy when the watchPattern is triggered. **Default: true**
* `java` : string with the system java path. **Default: 'java'**
* `fatJar`: the location of your runnable jar.

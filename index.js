const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const chalk = require('chalk');

const defaults = {
  extractOnly: false
};

function VertxPlugin(options) {
  // Setup the plugin instance with options...
  this.config = options || {};

  for (let k in defaults) {
    if (!this.config.hasOwnProperty(k)) {
      //apply defaults if not present
      this.config[k] = defaults[k];
    }
  }
}

VertxPlugin.prototype.apply = function (compiler) {
  let self = this;

  compiler.plugin('before-run', function (compiler, callback) {

    // verify if the pom.xml exists
    fs.stat(path.resolve(process.cwd(), 'pom.xml'), function(err, stat) {
      if(err) {
        if (err.code === 'ENOENT') {
          console.log(chalk.yellow.bold('WARN: pom.xml not found, skipping nashorn modules extraction...'));
          self.config.noPom = true;
          callback();
        } else {
          callback(err);
        }
      } else {
        // execute mvn dependency:unpack-dependencies
        exec('mvn -f ' + path.resolve(process.cwd(), 'pom.xml') + ' -DoutputDirectory="' + path.resolve(process.cwd(), 'node_modules') + '" dependency:unpack-dependencies', function (error, stdout, stderr) {
          if (stdout) console.log(stdout);
          if (stderr) console.error(stderr);
          callback(error);
        });
      }
    });
  });

  if (!self.config.extractOnly) {
    compiler.plugin('after-emit', function (compilation, callback) {
      if (compilation.getStats().hasErrors()) {
        // skip
        callback();
      } else {
        if (self.config.noPom === false) {
          // skip
          callback();
        } else {
          // execute mvn package
          exec('mvn -f ' + path.resolve(process.cwd(), 'pom.xml') + ' package', function (error, stdout, stderr) {
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            callback(error);
          });
        }
      }
    });
  }
};

module.exports = VertxPlugin;

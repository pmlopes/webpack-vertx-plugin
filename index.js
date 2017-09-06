const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const chalk = require('chalk');

const defaults = {
  extractOnly: false,
  verbose: false,
  maven: 'mvn',
  redeploy: 'src/main/**/*',
  fatJar: null
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
  // always assume first run
  self.needsPackage = true;

  compiler.plugin('before-run', function (compiler, callback) {

    // verify if the pom.xml exists
    fs.stat(path.resolve(process.cwd(), 'pom.xml'), function (err, stat) {
      if (err) {
        if (err.code === 'ENOENT') {
          console.log(chalk.yellow.bold('WARN: pom.xml not found, skipping nashorn modules extraction...'));
          self.config.noPom = true;
          callback();
        } else {
          callback(err);
        }
      } else {
        // execute mvn dependency:unpack-dependencies
        exec(self.config.maven + ' -f ' + path.resolve(process.cwd(), 'pom.xml') + ' -DoutputDirectory="' + path.resolve(process.cwd(), 'node_modules') + '" dependency:unpack-dependencies', function (error, stdout, stderr) {
          if (self.config.verbose) {
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
          }
          callback(error);
        });
      }
    });
  });

  compiler.plugin('watch-run', function (watching, callback) {
    self.isWebpackWatching = true;
    callback();
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
          if (self.needsPackage) {
            exec(self.config.maven + ' -f ' + path.resolve(process.cwd(), 'pom.xml') + ' package', function (error, stdout, stderr) {
              if (self.config.verbose) {
                if (stdout) console.log(stdout);
                if (stderr) console.error(stderr);
              }

              if (error) {
                callback(error);
                return;
              }
              self.needsPackage = false;

              if (self.isWebpackWatching) {
                if (self.config.fatJar && self.config.redeploy) {
                  let watchPattern = path.resolve(process.cwd(), self.config.redeploy);
                  let fatJar = path.resolve(process.cwd(), self.config.fatJar);

                  callback(error);

                  exec('java -jar ' + fatJar + ' --redeploy="' + watchPattern + '" --on-redeploy="' + self.config.maven + ' -f ' + path.resolve(process.cwd(), 'pom.xml') + ' package"', function (error, stdout, stderr) {
                    if (self.config.verbose) {
                      if (stdout) console.log(stdout);
                      if (stderr) console.error(stderr);
                    }
                  });
                }
              }
            });
          } else {
            callback();
          }
        }
      }
    });
  }
};

module.exports = VertxPlugin;

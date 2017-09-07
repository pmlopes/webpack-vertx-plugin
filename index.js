const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
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
        exec(
          self.config.maven,
          ['-f', path.resolve(process.cwd(), 'pom.xml'), '-DoutputDirectory="' + path.resolve(process.cwd(), 'node_modules') + '"', 'dependency:unpack-dependencies'],
          self.config,
          callback);
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
            exec(
              self.config.maven,
              ['-f', path.resolve(process.cwd(), 'pom.xml'), 'package'],
              self.config,
              function (err) {

              if (err) {
                callback(err);
                return;
              }

              self.needsPackage = false;

              if (self.isWebpackWatching) {
                if (self.config.fatJar && self.config.redeploy) {
                  let watchPattern = path.resolve(process.cwd(), self.config.redeploy);
                  let fatJar = path.resolve(process.cwd(), self.config.fatJar);

                  exec(
                    'java',
                    ['-jar', fatJar, '--redeploy=' + watchPattern, '--on-redeploy=' + self.config.maven + ' -f ' + path.resolve(process.cwd(), 'pom.xml') + ' package'],
                    self.config);

                  callback();
                }
              } else {
                callback();
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

function exec(command, args, options, callback) {

  const proc = spawn(command, args);
  console.log('Running: ' + chalk.bold(command) + '...');

  proc.stdout.on('data', function (data) {
    if (options.verbose) {
      process.stdout.write(data);
    }
  });

  proc.stderr.on('data', function (data) {
    process.stderr.write(data);
  });

  proc.on('close', function (code) {
    if (callback) {
      if (code) {
        callback(chalk.yellow.bold('Error: '+ command + " exit code " + code + '.' + (options.verbose ? '' : ' Re-run with verbose enabled for more details.')));
      } else {
        callback();
      }
    }
  });

  proc.on('error', function (err) {
    if (callback) {
      callback(chalk.red.bold(err));
    }
  });
}

module.exports = VertxPlugin;

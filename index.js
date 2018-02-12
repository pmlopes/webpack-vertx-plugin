const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const chalk = require('chalk');

const defaults = {
  extractOnly: false,
  verbose: false,
  watchPattern: null,
  verticle: null
};

const dir = process.cwd();

/**
 * Helper to select local maven wrapper or system maven
 *
 * @param dir current working directory
 * @returns {string} the maven command
 */
function getMaven(dir) {
  var mvn = 'mvn';
  var isWin = /^win/.test(process.platform);

  // check for wrapper
  if (isWin) {
    if (fs.existsSync(path.resolve(dir, 'mvnw.bat'))) {
      mvn = path.resolve(dir, 'mvnw.bat');
    }
  } else {
    if (fs.existsSync(path.resolve(dir, 'mvnw'))) {
      mvn = path.resolve(dir, 'mvnw');
    }
  }

  return mvn;
}

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
  const self = this;

  compiler.plugin('before-run', function (compiler, callback) {
    if (self.config.extractOnly && fs.existsSync(path.resolve(dir, 'pom.xml'))) {
      // execute mvn dependency:unpack-dependencies
      exec(
        getMaven(dir),
        [
          '-f', path.resolve(dir, 'pom.xml'),
          '-DoutputDirectory=' + dir,
          '-Dmdep.unpack.includes=node_modules/**/*',
          'dependency:unpack-dependencies'],
        Object.create(process.env),
        self.config,
        callback);
    } else {
      callback();
    }
  });

  compiler.plugin('watch-run', function (watching, callback) {
    if (!self.isWebpackWatching) {
      // create a tmp file to communicate to the JVM if needed
      self.fd = fs.openSync(path.resolve(dir, '.hot-reload'), 'a');

      var onExit = function () {
        if (self.fd) {
          fs.closeSync(self.fd);
          fs.unlinkSync(path.resolve(dir, '.hot-reload'));
          delete self.fd;
        }
      };

      //do something when app is closing
      process.on('exit', onExit);
      //catches ctrl+c event
      process.on('SIGINT', onExit);
      // catches "kill pid" (for example: nodemon restart)
      process.on('SIGUSR1', onExit);
      process.on('SIGUSR2', onExit);
      //catches uncaught exceptions
      process.on('uncaughtException', onExit);

      self.isWebpackWatching = true;
    }

    callback();
  });


  if (!self.config.extractOnly) {
    compiler.plugin('after-emit', function (compilation, callback) {
      // quick stop execution
      if (compilation.getStats().hasErrors() || !self.isWebpackWatching || !fs.existsSync(path.resolve(dir, 'pom.xml'))) {
        callback();
      } else {
        // verify if the JVM is already running
        if (!self.jvmPid) {
          // there is no JVM we are aware, so we need a bit of house keeping:
          // we start the JVM
          self.jvmPid = exec(
            getMaven(dir),
            [
              '-f', path.resolve(dir, 'pom.xml'),
              'compile',
              'exec:java',
              '-Dexec.mainClass=io.vertx.core.Launcher',
              '-Dexec.args=run ' + self.config.verticle + (self.config.watchPattern ? ' --redeploy=' + path.resolve(dir, self.config.watchPattern) : '')
            ],
            Object.create(process.env),
            self.config,
            function (err) {
              // clear the pid information
              delete self.jvmPid;
              // if the process error'ed or exited
              if (err) {
                callback(err);
              }
            });

          if (!self.jvmPid) {
            callback('Failed to start maven');
          } else {
            callback();
          }
        } else {
          if (self.fd) {
            fs.write(self.fd, Date.now() + ': Warnings? ' + compilation.getStats().hasWarnings() + '\n', function (err) {
              if (err) {
                callback(err);
              } else {
                fs.fsync(self.fd, callback);
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

function exec(command, args, env, options, callback) {

  const proc = spawn(command, args, {env: env});

  if (args && args.length > 0) {
    console.log('Running: ' + chalk.bold(command) + ' ... ' + chalk.bold(args[args.length - 1]));
  } else {
    console.log('Running: ' + chalk.bold(command));
  }
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
        callback(chalk.yellow.bold('Error: ' + command + " exit code " + code + '.' + (options.verbose ? '' : ' Re-run with verbose enabled for more details.')));
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

  return proc;
}

module.exports = VertxPlugin;

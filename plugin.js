var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

function VertxPlugin(options) {
    // Setup the plugin instance with options...
    this.config = options || {
            groupId: 'com.example',
            artifactId: 'com.example',
            version: '1.0.0',
            name: 'example',
            description: '',
            javaDependencies: {
                'io.vertx:vertx-lang-js': '3.4.2'
            }
        };
}

VertxPlugin.prototype.apply = function (compiler) {
    var self = this;

    compiler.plugin('before-run', function (compiler, callback) {
        // generate pom.xml
        var pom = generatePom(self.config, compiler.options);

        // generate pom.xml
        fs.writeFile(path.resolve(process.cwd(), '.pom.xml'), pom, function (err) {
            if (err) {
                callback(err);
            } else {
                // execute mvn dependency:unpack-dependencies
                exec('mvn -f .pom.xml dependency:unpack-dependencies', function (error, stdout, stderr) {
                    if (stdout) console.log(stdout);
                    if (stderr) console.error(stderr);
                    callback(error);
                });
            }
        });
    });

    compiler.plugin('after-emit', function (compilation, callback) {
        if (compilation.getStats().hasErrors()) {
            // skip
            callback();
        } else {
            // execute mvn package
            exec('mvn -f .pom.xml package', function (error, stdout, stderr) {
                if (stdout) console.log(stdout);
                if (stderr) console.error(stderr);
                callback(error);
            });
        }
    });
};

function generatePom(config, options) {

    var pom =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<project xmlns="http://maven.apache.org/POM/4.0.0"\n' +
        '         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
        '         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">\n' +
        '\n' +
        '  <modelVersion>4.0.0</modelVersion>\n' +
        '  <packaging>jar</packaging>\n' +
        '\n' +
        '  <groupId>' + config.groupId + '</groupId>\n' +
        '  <artifactId>' + config.artifactId + '</artifactId>\n' +
        '  <version>' + config.version + '</version>\n' +
        '\n' +
        '  <name>' + config.name + '</name>\n' +
        '  <description>' + (config.description || '') + '</description>\n' +
        '\n' +
        '  <dependencies>\n';

    for (var dep in config.javaDependencies) {
        if (config.javaDependencies.hasOwnProperty(dep)) {
            pom +=
                '    <dependency>\n' +
                '      <groupId>' + dep.split(':')[0] + '</groupId>\n' +
                '      <artifactId>' + dep.split(':')[1] + '</artifactId>\n' +
                '      <version>' + config.javaDependencies[dep] + '</version>\n' +
                '    </dependency>\n';
        }
    }

    pom +=
        '  </dependencies>\n' +
        '\n' +
        '  <build>\n' +
        '    <resources>\n' +
        '      <resource>\n' +
        '        <directory>' + options.output.path + '</directory>\n' +
        '      </resource>\n' +
        '    </resources>\n' +
        '    <plugins>\n' +
        '      <plugin>\n' +
        '        <groupId>org.apache.maven.plugins</groupId>\n' +
        '        <artifactId>maven-dependency-plugin</artifactId>\n' +
        '        <version>3.0.1</version>\n' +
        '        <configuration>\n' +
        '          <includes>**/*.js</includes>\n' +
        '          <outputDirectory>${project.basedir}/../node_modules</outputDirectory>\n' +
        '          <overWriteReleases>false</overWriteReleases>\n' +
        '          <overWriteSnapshots>true</overWriteSnapshots>\n' +
        '        </configuration>\n' +
        '      </plugin>\n' +
        '      <plugin>\n' +
        '        <groupId>org.apache.maven.plugins</groupId>\n' +
        '        <artifactId>maven-shade-plugin</artifactId>\n' +
        '        <version>2.3</version>\n' +
        '        <executions>\n' +
        '          <execution>\n' +
        '            <phase>package</phase>\n' +
        '            <goals>\n' +
        '              <goal>shade</goal>\n' +
        '            </goals>\n' +
        '            <configuration>\n' +
        '              <transformers>\n' +
        '                <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">\n' +
        '                  <manifestEntries>\n' +
        '                    <Main-Class>io.vertx.core.Launcher</Main-Class>\n' +
        '                    <Main-Verticle>' + options.output.filename + '</Main-Verticle>\n' +
        '                  </manifestEntries>\n' +
        '                </transformer>\n' +
        '                <transformer implementation="org.apache.maven.plugins.shade.resource.AppendingTransformer">\n' +
        '                  <resource>META-INF/services/io.vertx.core.spi.VerticleFactory</resource>\n' +
        '                </transformer>\n' +
        '              </transformers>\n' +
        '              <outputFile>${project.basedir}/run.jar</outputFile>\n' +
        '            </configuration>\n' +
        '          </execution>\n' +
        '        </executions>\n' +
        '      </plugin>\n' +
        '    </plugins>\n' +
        '  </build>\n' +
        '</project>\n';

    return pom;
}

module.exports = VertxPlugin;

// jshint esnext: true

const bono = require('bono');
const Bundle = new require('bono/lib/bundle');
const url = require('url');
const fs = require('fs-promise');
const path = require('path');
const _ = require('lodash');
const yaml = require('js-yaml');
const Service = require('../service');

module.exports = (function() {
  'use strict';

  function *prepareComponents (execution) {
    var componentFiles;

    // core components
    var baseDir = path.resolve(__dirname, '../components');
    try {
      componentFiles = yield fs.readdir(baseDir);
    } catch(e) {
      componentFiles = [];
    }
    _.forEach(componentFiles, function(componentFile) {
      if (path.extname(componentFile) === '.js') {
        var name = path.basename(componentFile, '.js');
        execution.addComponent(name, require(path.join(baseDir, name)));
      }
    });

    // container-specific components
    baseDir = path.resolve('./components');
    try {
      componentFiles = yield fs.readdir(baseDir);
    } catch(e) {
      componentFiles = [];
    }
    _.forEach(componentFiles, function(componentFile) {
      if (path.extname(componentFile) === '.js') {
        var name = path.basename(componentFile, '.js');
        execution.addComponent(name, require(path.join(baseDir, name)));
      }
    });
  }

  function *prepareServices (execution) {
    yield Service.scan(execution.app);
  }

  function *prepareOptions (execution) {
    var opts = execution.opts;
    var configFile = opts.file || opts.f || path.resolve('./yesbee.yml');
    try {
      var content = yield fs.readFile(configFile, 'utf8');
      _.defaults(opts, yaml.safeLoad(content));
    } catch(e) {}

    if (!opts.host && !opts.socketPath) {
      opts.socketPath = path.resolve('./yesbee.sock');
    }
  }

  function *prepareDaemon (execution) {
    var daemon = bono();

    execution.app.callback = function() {
      return daemon.callback();
    };

    daemon.routeGet('/', function() {
      return {
        name: 'yesbee',
        version: require('../../package.json').version,
        apiUrl: '/v2',
      };
    });

    var baseDir = path.resolve(__dirname, '../api');
    _.forEach(yield fs.readdir(baseDir), function(file) {
      var name = path.basename(file, '.js');
      daemon.addBundle({
        uri: '/v2/' + name,
        handler: new Bundle(require(path.join(baseDir, name))(execution.app)),
      });
    });

    daemon.addMiddleware(function *(next) {
      execution.logger({$name:'daemon', message: this.method + ' ' + this.url});

      yield next;

      if (this.status !== 404) {
        this.body = this.state;
      }
    });

    if (execution.opts.host) {
      var parsed = url.parse(execution.opts.host);
      daemon.listen(parsed.port, parsed.hostname, function() {
        execution.logger({message: 'Listening at ' + execution.opts.host });
      });
    } else if (execution.opts.socketPath) {
      try {
        fs.unlinkSync(execution.opts.socketPath);
      } catch(e) {}

      yield new Promise(function(resolve, reject) {
        daemon.listen(execution.opts.socketPath, function() {
          execution.logger({message: 'Listening at ' + execution.opts.socketPath });
          resolve();
        });
      });
    } else {
      throw new Error('Cannot bind daemon to either host or socket path');
    }
  }

  function *daemonCommand (execution) {
    yield prepareOptions(execution);
    yield prepareComponents(execution);
    yield prepareServices(execution);
    yield prepareDaemon(execution);
  }
  return daemonCommand;
})();
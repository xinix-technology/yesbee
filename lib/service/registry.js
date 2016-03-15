'use strict';

const _ = require('lodash');
const co = require('co');
const path = require('path');
const fs = require('fs-promise');
const assert = require('assert');
// const EventEmitter = require('events');
// const delegate = require('delegates');
// const Route = require('./route');

module.exports = function(Service) {

  var Registry = function(context) {
    Object.defineProperties(this, {
      context: {enumerable: false, writable: false, configurable: false, value: context},
      values: {enumerable: false, writable: true, configurable: false, value: {}},
    });
  };

  Registry.prototype = {
    *scan() {
      var serviceFiles;

      // core services
      var baseDir = path.resolve('./services');
      try {
        serviceFiles = yield fs.readdir(baseDir);
      } catch(e) {
        serviceFiles = [];
      }

      yield _.map(serviceFiles, function(serviceFile) {
        return co(function *() {
          if (path.extname(serviceFile) === '.js') {
            var name = path.basename(serviceFile, '.js');
            var servicePath = path.resolve(baseDir, serviceFile);
            var version = fs.statSync(servicePath).mtime.getTime();
            if (require.cache[servicePath]) {
              var service = this.values[name];
              if (service._version !== version) {
                var oldStatus = service.status;
                delete require.cache[servicePath];
                yield service.destroy();
                service = this.put(name, require(servicePath), version);
                if (oldStatus === Service.STARTED) {
                  yield service.start();
                }
              }
            } else {
              this.put(name, require(servicePath), version);
            }
          }
        }.bind(this));
      }.bind(this));
    },

    get(name) {
      return this.values[name];
    },

    create(name, initialize, version) {
      assert('string' === typeof name, 'Invalid arguments, {string} name, {function} initialize');
      assert('function' === typeof initialize, 'Invalid arguments, {string} name, {function} initialize');

      var service = new Service.Impl(this.context, name);
      service._version = version;

      initialize(service);

      return service;
    },

    put(name, initialize, version) {
      var service = this.create(name, initialize, version);
      this.values[name] = service;

      return service;
    },

    all() {
      return this.values;
    }
  };

  return Registry;
};

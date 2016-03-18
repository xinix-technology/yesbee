'use strict';

const _ = require('lodash');
const co = require('co');
const path = require('path');
const fs = require('fs-promise');
const assert = require('assert');
// const EventEmitter = require('events');
// const delegate = require('delegates');
// const Route = require('./route');

const BASE_DIR = path.resolve('./services');

module.exports = function(Service) {

  var Registry = function(context) {
    Object.defineProperties(this, {
      context: {enumerable: false, writable: false, configurable: false, value: context},
      values: {enumerable: false, writable: true, configurable: false, value: {}},
    });
  };

  Registry.prototype = {
    *resolve(name, options) {
      options = options || {};
      assert('string' === typeof name, 'Invalid arguments, {string} name');

      var servicePath = (name[0] === '/' ? name : path.resolve(BASE_DIR, name))  + '.js';
      var stat = fs.lstatSync(servicePath);
      var version = stat.mtime.getTime();

      var putService = function() {
        var initialize = require(servicePath);
        initialize.version = initialize.version || version;
        if (this.context.isWorker) {
          initialize.useWorker = false;
        }
        return this.put(name, this.create(name, initialize));
      };

      var service = this.values[name];
      if (!this.values[name]) {
        service = putService.call(this);
      } else if (require.cache[servicePath]) {
        service = this.values[name];
        if (service.version !== version) {
          var oldStatus = service.status;
          delete require.cache[servicePath];
          yield service.destroy();

          service = putService.call(this);
          if (oldStatus === Service.STARTED) {
            yield service.start();
          }
        }
      }

      return service;
    },

    *scan() {
      var serviceFiles;

      // core services
      try {
        serviceFiles = yield fs.readdir(BASE_DIR);
      } catch(e) {
        serviceFiles = [];
      }

      yield _.map(serviceFiles, function(serviceFile) {
        return co(function *() {
          if (path.extname(serviceFile) === '.js') {
            var name = path.basename(serviceFile, '.js');
            yield this.resolve(name);
          }
        }.bind(this));
      }.bind(this));
    },

    get(name) {
      return this.values[name];
    },

    create(name, initialize) {
      assert('string' === typeof name, 'Invalid arguments, {string} name, {function} initialize');
      assert('function' === typeof initialize, 'Invalid arguments, {string} name, {function} initialize');

      return new Service.Impl(this.context, name, initialize);
    },

    put(name, service) {
      assert('string' === typeof name, 'Invalid arguments, {string} name, {Service} service');
      assert(service instanceof Service.Impl, 'Invalid arguments, {string} name, {Service} service');

      this.values[name] = service;
      return service;
    },

    all() {
      return this.values;
    }
  };

  return Registry;
};

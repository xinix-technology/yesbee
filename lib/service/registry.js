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
    resolve(options) {
      assert('object' === typeof options, 'Invalid arguments, {object} options {name}');
      assert('string' === typeof options.name, 'Invalid arguments, {object} options {name}');

      return co(function *() {
        var servicePath = (options.name[0] === '/' ? options.name : path.resolve(BASE_DIR, options.name))  + '.js';
        var stat = fs.lstatSync(servicePath);
        var version = stat.mtime.getTime();

        var putService = function() {
          options.initialize = require(servicePath);
          options.version = options.version || version;
          // if (this.context.isWorker) {
          //   initialize.useWorker = false;
          // }
          return this.put(options.name, this.create(options));
        };


        var service = this.values[options.name];
        if (!this.values[options.name]) {
          service = putService.call(this);
        } else if (require.cache[servicePath]) {
          service = this.values[options.name];
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
      }.bind(this));
    },

    *scan(options) {
      options = options || {};
      var serviceFiles;

      // core services
      try {
        serviceFiles = yield fs.readdir(BASE_DIR);
      } catch(e) {
        serviceFiles = [];
      }

      var autoServices = yield _.reduce(serviceFiles, function(result, serviceFile) {
        if (path.extname(serviceFile) === '.js') {
          var name = path.basename(serviceFile, '.js');
          var opts = _.defaults({name:name}, options[name]);
          var service = this.resolve(opts);
          if (opts.auto) {
            result.push(service);
          }
        }
        return result;
      }.bind(this), []);

      yield _.map(autoServices, function(service) {
        return service.start();
      });
    },

    get(name) {
      return this.values[name];
    },

    create(options) {
      assert('object' === typeof options, 'Invalid arguments, {object} options {name}');
      assert('string' === typeof options.name, 'Invalid arguments, {object} options {name}');

      return new Service.Impl(this.context, options);
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

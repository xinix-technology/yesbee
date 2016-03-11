// jshint esnext: true
const _ = require('lodash');
const EventEmitter = require('events');
const delegate = require('delegates');
const Route = require('./route');
const co = require('co');
const assert = require('assert');
const path = require('path');
const fs = require('fs-promise');

module.exports = (function() {
  'use strict';

  var sequence = 0;

  function Service (context, name) {
    assert(context, 'Invalid arguments, {App} context, {string} uri');
    assert('string' === typeof name, 'Invalid arguments, {App} context, {string} uri');

    Object.defineProperties(this, {
      context: {enumerable: false, writable: false, configurable: false, value: context},
      client: {enumerable: false, get() { return context.client; } },
      id: {enumerable: true, writable: false, configurable: false, value: 'service-' + sequence++},
      name: {enumerable: true, writable: false, configurable: false, value: name},
      status: {enumerable: true, writable: true, configurable: false, value: 0},
      routes: {enumerable: false, writable: true, configurable: false, value: []},
      _version: {enumerable: false, writable: true, configurable: false, value: null},

      // make event emitter properties invisible
      domain: {enumerable: false, writable: true, configurable: false, value: null},
      _events: {enumerable: false, writable: true, configurable: false, value: null},
      _eventsCount: {enumerable: false, writable: true, configurable: false, value: null},
      _maxListeners: {enumerable: false, writable: true, configurable: false, value: null},
    });
    EventEmitter.call(this);
  }

  Service.prototype = {
    from(uri) {
      var route = new Route(this.context).from(uri);
      this.routes.push(route);
      return route;
    },

    start() {
      return co(function *() {
        yield _.map(this.routes, function(route) {
          return route.start();
        });
        this.status = Service.STARTED;
        this.logger({ message: 'Service ' + this.name + ' started' });
        this.emit('start');

        return this;
      }.bind(this));
    },

    stop() {
      return co(function *() {
        yield _.map(this.routes, function(route) {
          return route.stop();
        });
        this.status = Service.STOPPED;
        this.emit('stop');
        this.logger({ message: 'Service ' + this.name + ' stopped' });

        return this;
      }.bind(this));
    },

    destroy() {
      return co(function *() {
        yield this.stop();
        yield _.map(this.routes, function(route) {
          return route.destroy();
        });

        return this;
      }.bind(this));
    },
  };

  Object.setPrototypeOf(Service.prototype, EventEmitter.prototype);

  delegate(Service.prototype, 'context')
    .method('logger');

  delegate(Service.prototype, 'client')
    .method('request')
    .method('send');

  Service.STOPPED = 0;
  Service.STARTED = 1;

  var Registry = Service.Registry = function(context) {
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

      var service = new Service(this.context, name);
      service._initialize = initialize;
      service._version = version;
      service._initialize();

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



  return Service;
})();
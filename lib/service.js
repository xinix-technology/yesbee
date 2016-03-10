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

  function Service (app, name) {
    assert(app, 'Invalid arguments, {App} app, {string} uri');
    assert('string' === typeof name, 'Invalid arguments, {App} app, {string} uri');

    Object.defineProperties(this, {
      app: {enumerable: false, writable: false, configurable: false, value: app},
      client: {enumerable: false, get() { return app.client; } },
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
      var route = new Route(this.app).from(uri);
      this.routes.push(route);
      return route;
    },

    start() {
      return co(function *() {
        yield _.map(this.routes, function(route) {
          return route.start();
        });
        this.status = Service.STARTED;
        this.emit('start');
        this.logger({ message: 'Service ' + this.name + ' started' });
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
      }.bind(this));
    },

    destroy() {
      return co(function *() {
        yield this.stop();
        yield _.map(this.routes, function(route) {
          return route.destroy();
        });
      }.bind(this));
    },
  };

  Object.setPrototypeOf(Service.prototype, EventEmitter.prototype);

  delegate(Service.prototype, 'app')
    .method('logger');

  delegate(Service.prototype, 'client')
    .method('request')
    .method('send');

  Service.STOPPED = 0;
  Service.STARTED = 0;

  Service.S = 0;
  Service.add = function(app, name, initialize, version) {
    assert('string' === typeof name, 'Invalid arguments, {string} name, {function} initialize');
    assert('function' === typeof initialize, 'Invalid arguments, {string} name, {function} initialize');

    var service = new Service(app, name);
    service._initialize = initialize;
    service._version = version;
    service._initialize();
    app.services[name] = service;

    return service;
  };

  Service.scan = function *(app) {
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
            var service = app.services[name];
            if (service._version !== version) {
              var oldStatus = service.status;
              delete require.cache[servicePath];
              yield service.destroy();
              service = Service.add(app, name, require(servicePath), version);
              if (oldStatus === Service.STARTED) {
                yield service.start();
              }
            }
          } else {
            Service.add(app, name, require(servicePath), version);
          }
        }
      });
    });
  };
  return Service;
})();
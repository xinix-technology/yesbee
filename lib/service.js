// jshint esnext: true
const _ = require('lodash');
const EventEmitter = require('events');
const delegate = require('delegates');
const Route = require('./route');
const co = require('co');
const assert = require('assert');

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
        this.status = 1;
        this.emit('start');
      }.bind(this));
    },

    stop() {
      return co(function *() {
        yield _.map(this.routes, function(route) {
          return route.stop();
        });
        this.status = 0;
        this.emit('stop');
      }.bind(this));
    },
  };

  Object.setPrototypeOf(Service.prototype, EventEmitter.prototype);

  delegate(Service.prototype, 'app')
    .method('logger');

  delegate(Service.prototype, 'client')
    .method('request')
    .method('send');

  return Service;
})();
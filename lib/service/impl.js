'use strict';

const _ = require('lodash');
const EventEmitter = require('events');
const delegate = require('delegates');
const Route = require('../route');
const co = require('co');
const assert = require('assert');

module.exports = function(Service) {
  function Impl (context, name) {
    assert(context, 'Invalid arguments, {App} context, {string} uri');
    assert('string' === typeof name, 'Invalid arguments, {App} context, {string} uri');

    Object.defineProperties(this, {
      context: {enumerable: false, writable: false, configurable: false, value: context},
      client: {enumerable: false, get() { return context.client; } },
      id: {enumerable: true, writable: false, configurable: false, value: 'service-' + Service.sequence++},
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

  Impl.prototype = {
    from(uri, options) {
      var route = new Route(this.context).from(uri, options);
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

  Object.setPrototypeOf(Impl.prototype, EventEmitter.prototype);

  delegate(Impl.prototype, 'context')
    .method('logger');

  delegate(Impl.prototype, 'client')
    .method('request')
    .method('send');

  return Impl;
};
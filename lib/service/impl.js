'use strict';

const _ = require('lodash');
const EventEmitter = require('events');
const delegate = require('delegates');
const Route = require('../route');
const co = require('co');
const assert = require('assert');
const Worker = require('./worker');

module.exports = function(Service) {
  function Impl (context, options) {
    assert(context, 'Invalid arguments, {Context} context, {object} options {name, initialize}');
    assert('object' === typeof options, 'Invalid arguments, {Context} context, {object} options {name, initialize}');
    assert('string' === typeof options.name, 'Invalid arguments, {Context} context, {object} options {name, initialize}');
    assert('function' === typeof options.initialize, 'Invalid arguments, {Context} context, {object} options {name, initialize}');

    Object.defineProperties(this, {
      context: {enumerable: false, writable: false, configurable: false, value: context},
      client: {enumerable: false, get() { return context.client; } },
      id: {enumerable: true, writable: false, configurable: false, value: 'service-' + Service.sequence++},
      name: {enumerable: true, writable: false, configurable: false, value: options.name},
      version: {enumerable: false, writable: false, configurable: false, value: options.version},
      status: {enumerable: true, writable: true, configurable: false, value: 0},
      routes: {enumerable: false, writable: true, configurable: false, value: []},
      scale: {enumerable: false, writable: true, configurable: false, value: options.scale},
      auto: {enumerable: false, writable: true, configurable: false, value: options.auto},
    });

    Object.defineProperties(this, {
      workers: {enumerable: false, writable: false, configurable: false, value: [] },
      // make event emitter properties invisible
      domain: {enumerable: false, writable: true, configurable: false, value: null},
      _events: {enumerable: false, writable: true, configurable: false, value: null},
      _eventsCount: {enumerable: false, writable: true, configurable: false, value: null},
      _maxListeners: {enumerable: false, writable: true, configurable: false, value: null},
    });

    if (this.scale && !context.isWorker) {
      for(var i = 0; i < this.scale; i++) {
        this.workers.push(new Worker(this, i));
      }
    }

    EventEmitter.call(this);

    options.initialize.call(null, this);
  }

  Impl.prototype = {
    from(uri, options) {
      options = options || {};

      var route = new Route(this.context, this.workers).from(uri, options);
      this.routes.push(route);
      return route;
    },

    start() {
      return co(function *() {
        if (this.workers.length > 0) {
          yield _.map(this.workers, function(worker) {
            return worker.start();
          });
        }

        yield _.map(this.routes, function(route) {
          return route.start();
        });

        this.status = Service.STARTED;

        if (this.workers.length <= 0) {
          this.logger({ message: 'Service ' + this.name + ' started' });
          this.emit('start');
        }

        return this;
      }.bind(this));
    },

    stop() {
      return co(function *() {
        yield _.map(this.routes, function(route) {
          return route.stop();
        });

        if (this.workers.length > 0) {
          yield _.map(this.workers, function(worker) {
            return worker.stop();
          });
        }

        this.status = Service.STOPPED;

        if (this.workers.length <= 0) {
          this.emit('stop');
          this.logger({ message: 'Service ' + this.name + ' stopped' });
        }

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
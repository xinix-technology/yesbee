//jshint esnext:true
const _ = require('lodash');
const co = require('co');
const compose = require('koa-compose');
const delegate = require('delegates');
const assert = require('assert');

module.exports = (function() {
  'use strict';

  var sequence = 0;

  function Route (app) {
    assert(app, 'Invalid arguments, {App} app');

    Object.defineProperties(this, {
      app: {enumerable: false, writable: false, configurable: false, value: app},
      sources: {enumerable: false, writable: true, configurable: false, value: []},
      processors: {enumerable: false, writable: true, configurable: false, value: []},
      id: {enumerable: true, writable: false, configurable: false, value: 'route-' + sequence++},
      status: {enumerable: true, writable: true, configurable: false, value: 0},
    });
  }

  Route.prototype = {
    from(uri) {
      var source = this.getComponentByUri(uri).createSource(uri);
      this.sources.push(source);
      return this;
    },

    to(uri) {
      if (typeof uri === 'function') {
        return this.process(uri);
      }
      var processor = this.getComponentByUri(uri).createProcessor(uri);
      this.processors.push(processor);
      return this;
    },

    process(fn) {
      assert(typeof fn === 'function', 'Invalid arguments, {function} fn');
      var processor;
      if (fn.constructor.name === 'GeneratorFunction') {
        processor = fn;
      } else {
        processor = function *(next) {
          fn.call(this);
          yield next;
        };
      }
      this.processors.push(processor);
      return this;
    },

    start() {
      var processChain = co.wrap(compose(this.processors));

      _.forEach(this.sources, function(source) {
        source.start(processChain);
      });

      return this;
    },

    stop() {
      _.forEach(this.sources, function(source) {
        source.stop();
      });

      return this;
    },
  };

  delegate(Route.prototype, 'app')
    .method('getComponentByUri');
  return Route;
})();
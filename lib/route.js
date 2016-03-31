'use strict';

const _ = require('lodash');
const co = require('co');
const compose = require('koa-compose');
const delegate = require('delegates');
const assert = require('assert');

var sequence = 0;

module.exports = Route;

function Route (context, workers) {
  assert(context, 'Invalid arguments, {App} context');

  Object.defineProperties(this, {
    context: {enumerable: false, writable: false, configurable: false, value: context},
    sources: {enumerable: false, writable: true, configurable: false, value: []},
    processors: {enumerable: false, writable: true, configurable: false, value: []},
    id: {enumerable: true, writable: false, configurable: false, value: 'route-' + sequence++},
    workers: {enumerable: false, writable: false, configurable: false, value: workers},
    status: {enumerable: true, writable: true, configurable: false, value: 0},
  });
}

Route.prototype = {
  from(uri, options) {
    var source = this.components.get(uri).createSource(uri, options);
    this.sources.push(source);
    return this;
  },

  to(uri, options) {
    if (typeof uri === 'function') {
      return this.process(uri);
    }
    var processor = this.components.get(uri).createProcessor(uri, options);
    this.processors.push(processor);
    return this;
  },

  process(fn) {
    assert(typeof fn === 'function', 'Invalid arguments, {function} fn');
    var processor;
    var fnMeta = getFnMeta(fn);
    if (fnMeta.type === '*') {
      if (fnMeta.args[0]) {
        processor = fn;
      } else {
        processor = function *(next) {
          yield co(fn.bind(this));
          yield next;
        };
      }
    } else {
      processor = function *(next) {
        fn.call(this);
        yield next;
      };
    }
    this.processors.push(processor);
    return this;
  },

  destroy() {
    _.forEach(this.sources, function(source) {
      this.components.get(source.uri).removeSource(source);
      delete this.sources[this.sources.indexOf(source)];
    }.bind(this));
  },

  getConsumer() {
    var consumer;
    if (this.workers.length > 0) {
      var workers = this.workers;

      consumer = function() {
        var worker = workers.shift();
        workers.push(worker);
        return worker.consume(this);
      };
    } else {
      consumer = co.wrap(compose(this.processors));
    }

    return consumer;
  },

  start() {
    return co(function *() {
      var consumer = this.getConsumer();

      yield _.map(this.sources, function(source) {
        return source.start(consumer);
      });
    }.bind(this));
  },

  stop() {
    return co(function *() {
      yield _.map(this.sources, function(source) {
        return source.stop();
      });
    }.bind(this));
  },

  multicast() {
    const Multicast = require('./route/multicast');
    return new Multicast(this);
  },

  choice() {
    const Choice = require('./route/choice');
    return new Choice(this);
  }
};

delegate(Route.prototype, 'context')
  .access('components');

function getFnMeta(fn) {
  var matches = fn.toString().match(/^(?:function)?(\**)\s*([^(]*)\(([^)]*)\)/);
  var args = matches[3].trim().split(',').map((s) => s.trim());
  return {
    type: matches[1],
    name: matches[2],
    args: args,
  };
}
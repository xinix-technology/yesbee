// jshint esnext:true
const assert = require('assert');
const _ = require('lodash');
const delegate = require('delegates');
const co = require('co');
const Route = require('../route');

module.exports = (function() {
  'use strict';

  // var sequence = 0;

  function Choice (route) {
    Object.defineProperties(this, {
      // id: { enumerable: true, writable: true, configurable: false, value: 'choice-' + sequence++ },
      route: { enumerable: false, writable: true, configurable: false, value: route },
      whens: { enumerable: false, writable: true, configurable: false, value: [] },
    });

  }

  Choice.prototype = {
    when(predicate) {
      var wh = new When(this, predicate);
      this.whens.push(wh);
      return wh;
    },

    otherwise() {
      return this.when(() => true);
    },

    end() {
      const self = this;
      this.route.to(function *(next) {
        var result = _.find(self.whens, function(when) {
          return when.predicate(this);
        }.bind(this));

        yield result.processor.call(this, Promise.resolve());

        yield next;
      });
      return this.route;
    }
  };


  function When (choice, predicate) {
    Object.defineProperties(this, {
      // id: { enumerable: true, writable: true, configurable: false, value: 'when-' + When.sequence++ },
      choice: { enumerable: false, writable: true, configurable: false, value: choice },
      context: { enumerable: false, writable: true, configurable: false, value: choice.route.context },
      predicate: { enumerable: false, writable: true, configurable: false, value: predicate },
      processor: {enumerable: false, writable: true, configurable: false, value: null},
    });
  }

  // When.sequence = 0;

  When.prototype = {
    to(uri, options) {
      if (typeof uri === 'function') {
        return this.process(uri);
      }
      this.processor = this.components.get(uri).createProcessor(uri, options);

      return this.choice;
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
      this.processor = processor;
      return this.choice;
    },
  };

  delegate(When.prototype, 'context')
    .access('components');

  return Choice;
})();
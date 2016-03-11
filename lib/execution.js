// jshint esnext: true

const delegate = require('delegates');

module.exports = (function() {
  'use strict';

  function Execution (context, options) {
    options = options || {};

    Object.defineProperties(this, {
      context: {enumerable: false, writable: false, configurable: false, value: context},
      id: {enumerable: true, writable: false, configurable: false, value: options.id || 'help'},
      args: {enumerable: true, writable: false, configurable: false, value: options.args || []},
      opts: {enumerable: true, writable: false, configurable: false, value: options.opts || {}},
    });
  }

  delegate(Execution.prototype, 'context')
    .access('config')
    .method('run')
    .method('logger');

  return Execution;
})();
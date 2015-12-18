// jshint esnext: true

const delegate = require('delegates');

module.exports = (function() {
  'use strict';

  function Execution (app, options) {
    options = options || {};

    Object.defineProperties(this, {
      app: {enumerable: false, writable: false, configurable: false, value: app},
      id: {enumerable: true, writable: false, configurable: false, value: options.id || 'help'},
      args: {enumerable: true, writable: false, configurable: false, value: options.args || []},
      opts: {enumerable: true, writable: false, configurable: false, value: options.opts || {}},
    });
  }

  delegate(Execution.prototype, 'app')
    .access('config')
    .method('run')
    .method('logger')
    .method('addComponent')
    .method('addService');

  return Execution;
})();
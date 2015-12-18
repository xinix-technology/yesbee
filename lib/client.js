// jshint esnext:true
const assert = require('assert');

module.exports = (function() {
  'use strict';

  function Client (app) {
    assert(app, 'Invalid arguments, {App} app');
    Object.defineProperties(this, {
      app: {enumerable: false, writable: false, configurable: false, value: app}
    });
  }

  Client.prototype = {
    request(uri, body, headers) {
      assert('string' === typeof uri, 'Invalid arguments, {string} uri, {object} body[, {object} headers]');
      assert(body, 'Invalid arguments, {string} uri, {object} body[, {object} headers]');

      var component = this.app.getComponentByUri(uri);
      return component.request.apply(component, arguments);
    },

    send(uri, body, headers) {
      this.request.apply(this, arguments);
    }
  };

  return Client;
})();
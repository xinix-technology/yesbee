// jshint esnext:true
const assert = require('assert');
const Message = require('./message');

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
      var extractedUri = uri instanceof Message ? uri.uri : uri;
      var component = this.app.getComponentByUri(extractedUri);
      return component.request.apply(component, arguments);
    },

    send(uri, body, headers) {
      var extractedUri = uri instanceof Message ? uri.uri : uri;
      var component = this.app.getComponentByUri(extractedUri);
      return component.send.apply(component, arguments);
    }
  };

  return Client;
})();
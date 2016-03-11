// jshint esnext:true
const assert = require('assert');
const Message = require('./message');
const delegate = require('delegates');

module.exports = (function() {
  'use strict';

  function Client (context) {
    assert(context, 'Invalid arguments, {App} context');
    Object.defineProperties(this, {
      context: {enumerable: false, writable: false, configurable: false, value: context}
    });
  }

  Client.prototype = {
    request(uri, body, headers) {
      var extractedUri = uri instanceof Message ? uri.uri : uri;
      var component = this.components.get(extractedUri);
      return component.request.apply(component, arguments);
    },

    send(uri, body, headers) {
      var extractedUri = uri instanceof Message ? uri.uri : uri;
      var component = this.components.get(extractedUri);
      return component.send.apply(component, arguments);
    }
  };

  delegate(Client.prototype, 'context')
    .access('components');

  return Client;
})();
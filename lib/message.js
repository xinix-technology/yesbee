//jshint esnext:true
const uuid = require('node-uuid');
const _ = require('lodash');

module.exports = (function() {
  'use strict';

  function Message (uri, pattern) {
    Object.defineProperties(this, {
      id: { enumerable:false, writable:true, configurable: false, value: uuid.v1() },
      uri: { enumerable:true, writable:true, configurable: false, value: uri },
      pattern: { enumerable:true, writable:true, configurable: false, value: pattern /* || 'inOnly'*/ },
      body: { enumerable:false, writable:true, configurable: false, value: null },
      headers: { enumerable: false, writable: true, configurable: false, value: {} },
      error: { enumerable: false, writable: true, configurable: false, value: null },
    });
  }

  Message.prototype = {
    serialize() {
      return {
        id: this.id,
        uri: this.uri,
        headers: this.headers || {},
        body: this.body,
      };
    },

    merge(message) {
      _.mixin(this.headers, message.headers);
      this.body = message.body;
      return this;
    },

    clone() {
      var message = new Message(this.uri, this.pattern);
      message.merge(this);
      return message;
    }
  };

  return Message;
})();
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
      headers: { enumerable: false, writable: true, configurable: false, value: {} },
      body: { enumerable:false, writable:true, configurable: false, value: null },
      error: { enumerable: false, writable: true, configurable: false, value: null },
    });
  }

  Message.serialize = function(message) {
    return new Buffer(JSON.stringify(message.dump()));
  };

  Message.unserialize = function(data) {
    if (data instanceof Buffer) {
      data = JSON.parse(data);
    }

    if (data.error) {
      var err = data.error;
      data.error = new Error(err.message, err.fileName, err.lineNumber);
      if (err.name !== 'Error') {
        data.error.name = err.name;
      }
      data.error.stack = err.stack;
    }

    var message = new Message();
    message = _.merge(message, data);
    return message;
  };

  Message.prototype = {
    dump() {
      var err = null;
      if (this.error instanceof Error) {
        err = {
          message: this.error.message,
          name: this.error.name,
          stack: this.error.stack,
          fileName: this.error.fileName,
          lineNumber: this.error.lineNumber,
        };
      } else if (this.error) {
        err = {
          message: this.error.message || this.error
        };
      }

      return {
        id: this.id,
        uri: this.uri,
        pattern: this.pattern,
        headers: this.headers || {},
        body: this.body,
        error: err,
      };
    },

    /**
     * @deprecated in favor of Message.serialize
     */
    serialize() {
      return new Buffer(JSON.stringify(this.dump()));
    },

    /**
     * @deprecated in favor of Message.unserialize
     */
    unserialize(buffer) {
      var message = JSON.parse(buffer);
      this.merge(message);
      return this;
    },

    merge(message) {
      _.merge(this.headers, message.headers);
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
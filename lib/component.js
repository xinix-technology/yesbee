// jshint esnext: true
const Source = require('./source');
const Message = require('./message');
const delegate = require('delegates');
const co = require('co');
const _ = require('lodash');
const assert = require('assert');

module.exports = (function() {
  'use strict';

  var sequence = 0;

  function Component (app, name) {
    assert(app, 'Invalid arguments, {App} app, {string} name');
    assert('string' === typeof name, 'Invalid arguments, 2nd argument (name) must be instance of {string}');

    Object.defineProperties(this, {
      app: { enumerable: false, writable: false, configurable: false, value: app },
      id: { enumerable: true, writable: false, configurable: false, value: 'component-' + sequence++ },
      name: { enumerable: true, writable: false, configurable: false, value: name },
      sources: { enumerable: false, writable: true, configurable: false, value: {} },
    });
  }

  Component.prototype = {
    validateUri(uri) {
      assert('string' === typeof uri, 'Invalid arguments, {string} uri');
      assert.equal(uri.split(':', 2).shift(), this.name, 'Unsatisfied uri pattern ' + uri + ' for component:' + this.name);
    },

    createSource(uri) {
      this.validateUri(uri);

      if (this.sources[uri]) {
        throw new Error('Source with uri: ' + uri + ' already exists.');
      }

      var source = new Source(this, uri);
      this.sources[uri] = source;
      return source;
    },

    createProcessor(uri, options) {
      this.validateUri(uri);

      var component = this;
      return function *(next) {
        var oldUri = this.uri;
        this.uri = uri;
        if ('function' === typeof component.process) {
          var result = component.process(this, options || {});
          if (typeof result === 'object') {
            yield result;
          }
        }
        this.uri = oldUri;
        yield next;
      };
    },

    get(uri) {
      return this.sources[uri];
    },

    request(uri, body, headers) {
      var message;

      if (uri instanceof Message) {
        message = uri;
        uri = message.uri;
      } else {
        this.validateUri(uri);
        message = new Message(uri, 'inOut');
        message.merge({
          body: body,
          headers: headers,
        });
      }

      var source = this.sources[uri];
      assert(source, 'No source available for uri:' + uri);

      return co(function *() {
        yield source.consume(message);
        return message;
      }.bind(this));
    },

    send(uri, body, headers) {
      var message;

      if (uri instanceof Message) {
        message = uri;
        uri = message.uri;
      } else {
        this.validateUri(uri);
        message = new Message(uri, 'inOnly');
        message.merge({
          body: body,
          headers: headers,
        });
      }

      var source = this.sources[uri];
      assert(source, 'No source available for uri:' + uri);

      return co(function *() {
        yield source.consume(message);
        return message;
      }.bind(this));
    }
  };

  delegate(Component.prototype, 'app')
    .method('logger');

  return Component;
})();
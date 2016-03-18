'use strict';

const Source = require('../source');
const Message = require('../message');
const delegate = require('delegates');
const co = require('co');
const _ = require('lodash');
const assert = require('assert');

module.exports = function(Component) {

  var sequence = 0;

  function Impl (context, name) {
    assert(context, 'Invalid arguments, {App} context, {string} name');
    assert('string' === typeof name, 'Invalid arguments, 2nd argument (name) must be instance of {string}');

    Object.defineProperties(this, {
      context: { enumerable: false, writable: false, configurable: false, value: context },
      id: { enumerable: true, writable: false, configurable: false, value: 'component-' + sequence++ },
      name: { enumerable: true, writable: false, configurable: false, value: name },
      sources: { enumerable: false, writable: true, configurable: false, value: {} },
      defaultOptions: { enumerable: false, writable: true, configurable: false, value: {} },
    });
  }

  Impl.prototype = {
    validateUri(uri) {
      assert('string' === typeof uri, 'Invalid arguments, {string} uri');
      assert.equal(uri.split(':', 2).shift(), this.name, 'Unsatisfied uri pattern ' + uri + ' for component:' + this.name);
    },

    createSource(uri, options) {
      options = _.defaults(options || {}, this.defaultOptions);

      this.validateUri(uri);

      if (this.sources[uri]) {
        throw new Error('Source with uri: ' + uri + ' already exists.');
      }

      var source = new Source(this, uri, options);
      this.sources[uri] = source;
      return source;
    },

    removeSource(source) {
      delete this.sources[source.uri];
    },

    createProcessor(uri, options) {
      this.validateUri(uri);

      options = _.defaults(options || {}, this.defaultOptions);

      var component = this;

      return function *(next) {
        var oldUri = this.uri;
        this.uri = uri;

        if ('function' === typeof component.process) {
          var result = component.process(this, options);
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
        message = this.createMessage(uri, 'inOut');
        message.merge({
          body: body,
          headers: headers,
        });
      }

      var source = this.sources[uri];
      // when there is no local handler for uri use upstream consume
      if (this.context.isWorker && !source) {
        return this.context.consume(message);
      } else {
        assert(source, 'No source available for uri:' + uri);

        return co(function *() {
          yield source.consume(message);
          return message;
        });
      }
    },

    send(uri, body, headers) {
      var message;

      if (uri instanceof Message) {
        message = uri;
        uri = message.uri;
      } else {
        this.validateUri(uri);
        message = this.createMessage(uri, 'inOnly');
        message.merge({
          body: body,
          headers: headers,
        });
      }

      var source = this.sources[uri];
      // when there is no local handler for uri use upstream consume
      if (this.context.isWorker && !source) {
        return this.context.consume(message);
      } else {
        assert(source, 'No source available for uri:' + uri);

        return co(function *() {
          yield source.consume(message);
          return message;
        });
      }
    }
  };

  delegate(Impl.prototype, 'context')
    .method('logger')
    .method('createMessage');

  return Impl;
};
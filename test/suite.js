// jshint esnext: true
const _ = require('lodash');
const Context = require('../lib/context');
const path = require('path');
const assert = require('assert');
const sinon = require('sinon');
const co = require('co');
const delegate = require('delegates');

module.exports = (function() {
  'use strict';

  var sequence = 0;

  function Suite() {
    var context = new Context();
    context.logger = sinon.spy();
    Object.defineProperties(this, {
      id: { enumerable: true, value: 'suite-' + sequence++ },
      context: { enumerable: false, value: context },
      logger: { enumerable: false, get() { return this.context.logger; } },
    });
  }

  Suite.prototype = {
    addComponents() {
      assert(arguments.length, 'Invalid arguments, [{string|array} component...]');

      _.forEach(arguments, function(component) {
        var name, handler;
        if ('string' === typeof component) {
          name = component;
          handler = require(path.join('../lib/components', component));
        } else {
          throw new Error('Unimplemented yet');
        }
        this.context.components.values[name] = this.context.components.create(name, handler);
      }.bind(this));

      return this;
    },

    test(service) {
      assert(service, 'Invalid arguments, {function} service');

      return co(function *() {
        this.context.services.put('test', service);
        yield this.context.services.get('test').start();
      }.bind(this));
    },

    end() {
      return co(function *() {
        yield this.context.services.values.test.stop();
      }.bind(this));
    },

    request() {
      return this.context.client.request.apply(this.context.client, arguments);
    },

    send() {
      this.context.client.send.apply(this.context.client, arguments);

      return this;
    },

    get(uri) {
      return this.context.components.get(uri).get(uri);
    }
  };

  return Suite;
})();
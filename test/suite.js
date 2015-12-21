// jshint esnext: true
const _ = require('lodash');
const App = require('../lib/app');
const path = require('path');
const assert = require('assert');
const sinon = require('sinon');
const co = require('co');

module.exports = (function() {
  'use strict';

  var sequence = 0;

  function Suite() {
    var app = new App();
    app.logger = sinon.spy();
    Object.defineProperties(this, {
      id: { enumerable: true, value: 'suite-' + sequence++ },
      app: { enumerable: false, value: app },
      logger: { enumerable: false, get() { return this.app.logger; } },
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
        this.app.addComponent(name, handler);
      }.bind(this));

      return this;
    },

    test(service) {
      assert(service, 'Invalid arguments, {function} service');

      return co(function *() {
        this.app.addService('test', service);
        yield this.app.services.test.start();
      }.bind(this));
    },

    end() {
      return co(function *() {
        yield this.app.services.test.stop();
      }.bind(this));
    },

    request() {
      return this.app.client.request.apply(this.app.client, arguments);
    },

    send() {
      this.app.client.send.apply(this.app.client, arguments);

      return this;
    },

    get(uri) {
      return this.app.getComponentByUri(uri).get(uri);
    }
  };

  return Suite;
})();
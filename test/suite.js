// jshint esnext: true
const _ = require('lodash');
const App = require('../lib/app');
const path = require('path');
const assert = require('assert');
const sinon = require('sinon');

module.exports = (function() {
  'use strict';

  function Suite() {
    this.app = new App();
    this.logger = this.app.logger = sinon.spy();
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

      this.app.addService('test', service);
      this.app.services.test.start();
      return this;
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
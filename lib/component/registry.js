'use strict';

const assert = require('assert');
const path = require('path');

module.exports = function(Component) {
  function Registry(context) {
    Object.defineProperties(this, {
      context: {enumerable: false, writable: false, configurable: false, value: context},
      values: {enumerable: false, writable: true, configurable: false, value: {}},
    });
  }

  Registry.prototype = {
    get(uri) {
      assert('string' === typeof uri, 'Invalid arguments, {string} uri');

      try {
        var name = uri.split(':', 2)[0];

        var component = this.values[name];
        if (component) {
          return component;
        }

        component = this.lookup(name);
        if (component) {
          this.values[name] = component;
          return component;
        }

        throw new Error('Component: ' + name + ' not found, or broken component');
      } catch(e) {
        throw new Error('Component: ' + name + ' not found, or broken component, ' + e.message);
      }
    },

    lookup(name) {
      assert('string' === typeof name, 'Invalid arguments, {string} name');

      var initialize;
      try {
        initialize = require('../components/' + name);
      } catch(e) {
      }

      if (!initialize) {
        try {
          initialize = require(path.resolve('./node_modules/yesbee-' + name + '/components/' + name));
        } catch(e) {
        }
      }

      if (!initialize) {
        return;
      }

      return this.create(name, initialize);
    },

    create(name, initialize) {
      assert('function' === typeof initialize, 'Invalid arguments, {function} initialize');

      var component = new Component.Impl(this.context, name);
      initialize(component);

      return component;
    },

    all() {
      return this.values;
    }
  };

  return Registry;
};
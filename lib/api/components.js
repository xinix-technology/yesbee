// jshint esnext: true

const _ = require('lodash');

module.exports = function(context) {
  'use strict';

  return {
    routes: {
      index: {
        uri: '/',
        handler: function() {
          return _.values(context.components.all());
        }
      },
      read: {
        uri: '/{name}',
        handler: function() {
          var name = this.attributes.name;
          var component = context.components.get(name);
          if (!component) {
            this.throw(404);
          }
          return Promise.resolve(component);
        }
      },
    },
  };
};

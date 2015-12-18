// jshint esnext: true

const _ = require('lodash');

module.exports = function(app) {
  'use strict';

  return {
    routes: {
      index: {
        uri: '/',
        handler: function() {
          return _.values(app.components);
        }
      },
      read: {
        uri: '/{name}',
        handler: function() {
          var name = this.attributes.name;
          var component = app.components[name];
          if (!component) {
            this.throw(404);
          }
          return Promise.resolve(component);
        }
      },
    },
  };
};

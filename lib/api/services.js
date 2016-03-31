// jshint esnext: true

const _ = require('lodash');
const co = require('co');

module.exports = function(context) {
  'use strict';

  return {
    routes: {
      index: {
        uri: '/',
        handler: function() {
          return _.values(context.services.all());
        }
      },
      read: {
        uri: '/{name}',
        handler: function() {
          var name = this.attributes.name;
          var service = context.services.get(name);
          if (!service) {
            this.throw(404);
          }
          return Promise.resolve(service);
        }
      },
      start: {
        uri: '/{name}/start',
        handler: function() {
          var name = this.attributes.name;
          var service = context.services.get(name);
          if (!service) {
            this.throw(404);
          }
          return Promise.resolve(service.start());
        }
      },
      stop: {
        uri: '/{name}/stop',
        handler: function() {
          var name = this.attributes.name;
          var service = context.services.get(name);
          if (!service) {
            this.throw(404);
          }
          return Promise.resolve(service.stop());
        }
      },
      scan: {
        uri: '/null/scan',
        handler: function *() {
          yield context.services.scan();
          // return {};
        }
      },
    },
  };
};
// jshint esnext: true

const _ = require('lodash');
const co = require('co');
const Service = require('../service');

module.exports = function(app) {
  'use strict';

  return {
    routes: {
      index: {
        uri: '/',
        handler: function() {
          return _.values(app.services);
        }
      },
      read: {
        uri: '/{name}',
        handler: function() {
          var name = this.attributes.name;
          var service = app.services[name];
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
          var service = app.services[name];
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
          var service = app.services[name];
          if (!service) {
            this.throw(404);
          }
          return Promise.resolve(service.stop());
        }
      },
      scan: {
        uri: '/null/scan',
        handler: function *() {
          yield Service.scan(app);
          // return {};
        }
      }
    },
  };
};
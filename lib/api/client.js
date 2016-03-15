// jshint esnext: true

const _ = require('lodash');
const co = require('co');
const parse = require('co-body');

module.exports = function(context) {
  'use strict';

  return {
    routes: {
      send: {
        uri: '/send',
        method: 'post',
        handler: function *() {
          var route = this.get('X-Route');
          var body = yield parse(this);
          yield context.client.send(route, body, this.header);
        }
      }
    },
  };
};
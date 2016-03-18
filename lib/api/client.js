// jshint esnext: true

const _ = require('lodash');
const co = require('co');
const parse = require('co-body');
const JSONStream = require('JSONStream');
const Message = require('../message');

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
      },

      request: {
        uri: '/request',
        method: 'post',
        handler: function *() {
          var route = this.get('X-Route');
          var body = yield parse(this);
          try {
            var message = yield context.client.request(route, body, this.header);
            this.set({
              'X-Route-Uri': message.uri,
              'X-Route-Pattern': message.pattern,
            });

            _.forEach(message.headers, function(v, k) {
              var oldV = this.get(k);
              if (!oldV && oldV !== v) {
                this.set(k, v);
              }
            }.bind(this));
            return message.body;
          } catch(e) {
            this.status = 400;
            return {
              name: e.name,
              message: e.message,
              fileName: e.fileName,
              lineNumber: e.lineNumber,
              // stack: e.stack,
            };
          }
        }
      },

      channel: {
        uri: '/channel',
        method: 'post',
        handler: function *() {
          yield new Promise(function(resolve, reject) {
            var jsonStream = JSONStream.parse();
            jsonStream.on('data', function(data) {
              co(function *() {
                try {
                  if (typeof data.id === 'undefined') {
                    var errMessage = {
                      error: {
                        message: 'Unknown message id for correlation',
                      }
                    };
                    this.res.write(JSON.stringify(errMessage) + '\n');
                    return;
                  }
                  var message = Message.unserialize(data);
                  message.pattern = message.pattern || 'inOut';

                  var respMessage = yield context.request(message);

                  this.res.write(JSON.stringify(respMessage.dump()) + '\n');
                } catch (e) {
                  // console.error(e);
                }
              }.bind(this));
            }.bind(this));
            this.req.pipe(jsonStream);
          }.bind(this));
        },
      }
    },
  };
};
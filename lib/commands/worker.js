'use strict';

const Message = require('../message');
const co = require('co');
const _ = require('lodash');

const HEARTBEAT = 60000;

module.exports = function *(execution) {
  if (!process.send) {
    throw new Error('Worker must be forked from daemon process');
  }

  // var exchanges = {};

  execution.context.isWorker = true;
  execution.context.shutdown = function() {
    process.send({
      method: 'shutdown'
    });
  };

  // execution.context.consume = function(message) {
  //   return new Promise(function(resolve, reject) {
  //     exchanges[message.id] = [resolve, reject, message];

  //     process.send({
  //       method: 'upstream',
  //       message: message.dump()
  //     });
  //   });
  // };

  var name = execution.opts.service || execution.opts.s;
  var service = yield execution.context.services.resolve({ name: name });

  yield service.start();

  process.on('message', function(data) {
    switch (data.method) {
      case 'init':
        execution.args.push.apply(execution.args, data.message.args);
        _.defaults(execution.opts, data.message.opts);
        break;
      case 'consume':
        co(function *() {
          var message = Message.unserialize(data.message);
          try {
            message = yield execution.context.components.get(message.uri).request(message);
          } catch(e) {
            message.error = e;
          }
          process.send({
            method: 'consume',
            message: message.dump()
          });
        });
        break;
      // case 'upstream':
      //   var message = Message.unserialize(data.message);
      //   var exchange = exchanges[message.id];
      //   exchange[2].merge(message);
      //   if (message.error) {
      //     exchange[1](message.error);
      //   } else {
      //     exchange[0](message);
      //   }
      //   break;
      default:
        execution.logger({$name: '@worker', level: 'error', message: 'Unsupported rpc method: ' + data.method});
    }
  });

  process.send({
    method: 'started'
  });

  (function heartbeat() {
    // console.log('heartbeat', new Date());
    setTimeout(heartbeat, HEARTBEAT);
  })();
};

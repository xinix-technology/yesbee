'use strict';

const fork = require('child_process').fork;
const path = require('path');
const Message = require('../message');
const co = require('co');
const delegate = require('delegates');

function Worker(service) {
  Object.defineProperties(this, {
    name: { enumerable: true, writable: false, configurable: false, value: service.name },
    service: { enumerable: false, writable: false, configurable: false, value: service },
    proc: { enumerable: false, writable: true, configurable: false, value: null },
    exchanges: { enumerable: false, writable: false, configurable: false, value: {} },
  });
}

module.exports = Worker;

Worker.prototype = {
  start() {
    return new Promise(function(resolve, reject) {
      this.proc = fork(path.resolve(__dirname, '../../bin/yesbee'), ['worker', this.name], {
        silent: true
      });

      this.proc.on('message', function(data) {
        var message;
        switch (data.method) {
          case 'started':
            resolve();
            break;
          case 'shutdown':
            this.context.shutdown();
            break;
          case 'consume':
            message = Message.unserialize(data.message);
            var exchange = this.exchanges[message.id];
            exchange[2].merge(message);
            if (message.error) {
              exchange[1](message.error);
            } else {
              exchange[0](message);
            }
            break;
          case 'upstream':
            message = Message.unserialize(data.message);
            co(function *() {
              var respMessage = yield this.context.components.get(message.uri).request(message);
              this.proc.send({
                method: 'upstream',
                message: respMessage.dump(),
              });
            }.bind(this));
            break;
          default:
            this.logger({$name: '@main', message: 'Unsupported rpc method: ' + data.method});
        }
      }.bind(this));

      this.proc.stdout.on('data', function(chunk) {
        this.logger({$name: '@main', message: chunk.toString().trim()});
      }.bind(this));

      this.proc.stderr.on('data', function(chunk) {
        this.logger({$name: '@main', level: 'error', message: chunk.toString().trim()});
      }.bind(this));
    }.bind(this));
  },

  stop() {
    return new Promise(function(resolve, reject) {
      this.proc.kill();
      resolve();
    }.bind(this));
  },

  consume(message) {
    return co(function *() {
      var respMessage = yield new Promise(function(resolve, reject) {
        this.proc.send({
          method: 'consume',
          message: message.dump()
        });
        this.exchanges[message.id] = [resolve, reject, message];
      }.bind(this));

      delete this.exchanges[message.id];
    }.bind(this));
  }
};

delegate(Worker.prototype, 'service')
  .access('context')
  .method('logger');
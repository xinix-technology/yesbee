'use strict';

const fork = require('child_process').fork;
const path = require('path');
const Message = require('../message');
const co = require('co');
const delegate = require('delegates');
const _ = require('lodash');

function Worker(service, id) {
  Object.defineProperties(this, {
    name: { enumerable: true, writable: false, configurable: false, value: service.name },
    id: { enumerable: true, writable: false, configurable: false, value: id },
    service: { enumerable: false, writable: false, configurable: false, value: service },
    proc: { enumerable: false, writable: true, configurable: false, value: null },
    exchanges: { enumerable: false, writable: false, configurable: false, value: {} },
  });
}

module.exports = Worker;

Worker.prototype = {
  start() {
    return new Promise(function(resolve, reject) {
      var argv = ['--service', this.name, '--id', this.id, 'worker'];

      // _.forEach(this.context.main.opts, function(v, k) {
      //   var opt = (k.length > 1 ? '--' : '-') + k;
      //   if (!Array.isArray(v)) {
      //     v = [v];
      //   }
      //   for(var i in v) {
      //     argv.push(opt);
      //     argv.push(v[i]);
      //   }
      // });

      // argv.push('worker');

      // Array.prototype.push.apply(argv, this.context.main.args);

      this.proc = fork(path.resolve(__dirname, '../../bin/yesbee'), argv, {
        silent: true
      });

      this.proc.send({
        method: 'init',
        message: this.context.main,
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
        chunk.toString().trim().split('\n').forEach(function(s) {
          this.logger({$name: '@main', message: s});
        }.bind(this));
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
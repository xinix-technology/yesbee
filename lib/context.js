'use strict';

const _ = require('lodash');
const co = require('co');
const sprintf = require('sprintf-js').sprintf;
const assert = require('assert');
const delegate = require('delegates');
const Execution = require('./execution');
const Component = require('./component');
const Service = require('./service');
const Client = require('./client');
const Notify = require('./errors/notify');
const Message = require('./message');

const colors = require('colors');

module.exports = Context;

/**
 * Application context
 * @param {object} config Global configuration of app
 *
 * Application containes of registered components and services when running as daemon.
 *
 */
function Context(config) {
  var client;
  Object.defineProperties(this, {
    components: { enumerable: false, writable: false, configurable: false, value: new Component.Registry(this) },
    services: { enumerable: false, writable: false, configurable: false, value: new Service.Registry(this) },
    commands: { enumerable: false, writable: false, configurable: false, value: {} },
    client: { enumerable: false, get() { return client || (client = new Client(this)); } },
    config: { enumerable: false, writable: false, configurable: false, value: config || {}},
    main: { enumerable: false, writable: true, configurable: false, value: null},
    isWorker: { enumerable: false, writable: true, configurable: false, value: false},
  });
}

Context.prototype = {
  run(options) {
    var execution = this.main = new Execution(this, options);
    if (!this.commands[execution.id]) {
      try {
        this.commands[execution.id] = require('./commands/' + execution.id);
      } catch(e) {
        throw new Notify('Undefined command ' + execution.id + ' or broken command');
      }
    }
    return co.wrap(this.commands[execution.id])(execution);
  },

  shutdown() {
    return co(function *() {
      yield _.map(this.services.all(), function(service) {
        return service.stop();
      });
      process.exit();
    }.bind(this));
  },

  logger(data) {
    assert('object' === typeof data, 'Invalid arguments, {object} data');
    var name = (typeof data.$name === 'undefined' || data.$name === null) ? '-' : data.$name;
    var level = data.level || 'info';
    var message = data.message;

    var placeholder;
    if (level === 'error') {
      placeholder = '%-10.10s | %s'.red;
      name = '*' + name;
      console.error(sprintf(placeholder, name, message.white));
    } else {
      name = '' + name;
      placeholder = '%-10.10s | %s'.green;
      console.log(sprintf(placeholder, name, message.white));
    }
  },

  createMessage(uri, pattern) {
    return new Message(uri, pattern);
  },
};

delegate(Context.prototype, 'client')
  .method('send')
  .method('request');
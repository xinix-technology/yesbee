// jshint esnext:true
const assert = require('assert');
const _ = require('lodash');
const delegate = require('delegates');
const co = require('co');
const Route = require('../route');

module.exports = (function() {
  'use strict';

  function Multicast (route, strategy) {
    assert(route, 'Invalid arguments, {Route} route');

    if ('function' !== typeof strategy) {
      strategy = Multicast.strategies[strategy] || Multicast.strategies['default'];
    }

    Object.defineProperties(this, {
      route: {enumerable: false, writable: false, configurable: false, value: route},
      app: {enumerable: false, writable: false, configurable: false, value: route.app},
      processors: {enumerable: false, writable: true, configurable: false, value: []},
      strategy: {enumerable: false, writable: true, configurable: false, value: strategy, }
    });
  }

  Multicast.prototype = {
    to: Route.prototype.to,
    process: Route.prototype.process,
    end() {
      const self = this;
      const strategy = this.strategy;
      const resolvedPromise = Promise.resolve();

      this.route.to(function *(next) {
        var originalMessage = this;

        var resultMessage = yield new Promise(function(resolve, reject) {
          var resultMessage;
          var length = self.processors.length;
          var processed = 0;
          _.forEach(self.processors, function(processor) {
            var message = originalMessage.clone();
            co(function *() {
              yield processor.call(message, resolvedPromise);

              // skip if already done
              if (resultMessage && resultMessage['multicast-done']) {
                return;
              }
              resultMessage = strategy(resultMessage, message);
              processed++;
              if (processed >= length) {
                resultMessage.headers['multicast-done'] = true;
              }
              if (resultMessage.headers['multicast-done']) {
                resolve(resultMessage);
              }
            }).catch(function(err) {
              console.error('Not supposed got here');
              console.error(err.stack);
              // do nothing
            });
          });
        });
        originalMessage.merge(resultMessage);
        yield next;
      });
      return this.route;
    }
  };

  delegate(Multicast.prototype, 'app')
    .method('getComponentByUri');

  Multicast.strategies = {
    default(message, newMessage) {
      return newMessage;
    }
  };

  return Multicast;
})();
/**
 * yesbee components/multicast
 *
 * MIT LICENSE
 *
 * Copyright (c) 2014 PT Sagara Xinix Solusitama - Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @author     Ganesha <reekoheek@gmail.com>
 * @copyright  2014 PT Sagara Xinix Solusitama
 */
var Route = require('../route'),
    channel = require('../channel'),
    Channel = channel.Channel,
    Q = require('q'),
    _ = require('lodash'),
    uuid = require('node-uuid'),
    aggregation = require('../aggregation');

module.exports = {
    processors: [],

    start: function() {
        var that = this;

        this.scopes = {};

        this.constructor.prototype.start.apply(this, arguments);

        _.each(this.processors, function(processor) {
            processor.start();
        });

    },

    stop: function() {
        _.each(this.processors, function(processor) {
            processor.stop();
        });

        this.constructor.prototype.stop.apply(this, arguments);
    },

    to: function(o, options) {

        var component = this.context.createComponent(o, options);
        component.route = this;
        this.processors.push(component);

        return this;
    },

    end: function() {
        return this.route;
    },

    setStrategy: function(strategy) {
        if (!strategy) {
            strategy = 'first';
        }

        if (typeof strategy === 'string') {
            strategy = aggregation.getStrategy(strategy);
        }

        this.strategy = strategy;
    },

    process: function(exchange) {
        var deferred = Q.defer(),
            callback = this.getChannelId(Channel.OUT),
            that = this;


        var scopeData = {
            deferred: deferred,
            aggregated: null,
            exchanges: {},
            length: 0,
            completed: 0
        };
        this.addScope(exchange, scopeData);

        _.each(this.processors, function(processor, id) {
            var whenExchange = exchange.clone();
            whenExchange.pattern = 'inOut';
            whenExchange.source = that;

            scopeData.exchanges[id] = {
                id: id,
                recipient: processor.id,
                status: false
            };
            scopeData.length++;

            whenExchange.header('multicast-id', id);
            whenExchange.header('multicast-recipient', processor.id);

            setImmediate(function() {
                that.context.send(Channel.IN, processor, whenExchange, that);
            });
        });

        return deferred.promise;
    },

    callback: function(exchange) {
        var scope = this.scopes[exchange.id];
        if (scope) {
            if (scope.data.completed < scope.data.length) {
                var id = exchange.header('multicast-id');
                var recipient = exchange.header('multicast-recipient');
                var exchangeData = scope.data.exchanges[id];

                exchange.removeHeader('multicast-id');
                exchange.removeHeader('multicast-recipient');

                if (exchangeData.status === false) {
                    scope.data.aggregated = this.strategy(scope.data.aggregated, exchange);
                    exchangeData.status = true;
                    scope.data.completed++;
                }
            }

            if (scope.data.completed === scope.data.length) {
                var original = scope.exchange;
                var aggregated = scope.data.aggregated;
                aggregated.source = original.source;
                aggregated.pattern = original.pattern;
                scope.data.deferred.resolve(aggregated);
            }
        }
    }
};
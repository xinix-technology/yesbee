/**
 * yesbee components/choice
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
    _ = require('lodash');

module.exports = {
    processorMap: [],

    start: function() {
        var that = this;

        this.constructor.prototype.start.apply(this, arguments);

        _.each(this.processorMap, function(processor) {
            processor.component.start();
        });

    },

    stop: function() {
        _.each(this.processorMap, function(processor) {
            processor.component.stop();
        });

        this.constructor.prototype.stop.apply(this, arguments);
    },

    when: function(expression) {
        if (this.endOfRules) {
            throw new Error('Cannot set when/otherwise after rules end');
        }
        this.processorMap.push({
            expression: expression,
            component: null
        });

        return this;
    },

    otherwise: function() {
        var result = this.when(function() { return true; });
        this.endOfRules = true;
        return result;
    },

    end: function() {
        return this.route;
    },

    to: function(o, options) {
        var last = this.processorMap[this.processorMap.length - 1];
        if (!last) {
            throw new Error('No context for new when/otherwise route');

        }

        var component = this.context.createComponent(o, options);
        component.route = this.route;

        last.component = component;

        return this;
    },

    process: function(exchange) {
        var deferred = Q.defer(),
            processor = _.find(this.processorMap, function(processor) {
                return processor.expression(exchange);
            }),
            to = processor.component,
            callback = this.context.getChannelId(Channel.OUT);

        console.log(callback, exchange.pattern);


        this.addScope(exchange, {
            deferred: deferred
        });

        var whenExchange = exchange.clone();
        whenExchange.source = this;
        whenExchange.pattern = 'inOut';

        // console.log('ccccc', exchange + '');
        // console.log('ccccc', whenExchange + '');

        this.context.send(Channel.IN, to, whenExchange, this);

        return deferred.promise;
    },

    callback: function(exchange) {
        var scope = this.scopes[exchange.id];
        if (scope) {
            var original = scope.exchange;

            exchange.source = original.source;
            exchange.pattern = original.pattern;

            scope.data.deferred.resolve(exchange);
        }
    }
};
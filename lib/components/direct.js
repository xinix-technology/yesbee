/**
 * yesbee components/direct
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
var Q = require('q'),
    channel = require('../channel'),
    Channel = channel.Channel;

module.exports = {
    process: function(exchange) {
        var outbound,
            deferred = Q.defer();

        if (this.type !== 'source') {
            outbound = this.context.lookup(this.uri);

            var clonedExchange = exchange.clone();
            clonedExchange.property('callback', this.context.getChannelId(Channel.OUT, this));

            this.addScope(exchange, {
                deferred: deferred
            });

            this.send(Channel.IN, outbound, clonedExchange);
        } else {
            deferred.resolve(exchange);
        }

        return deferred.promise;
    },

    callback: function(exchange) {
        if (this.type !== 'source') {
            var scope = this.scopes[exchange.id];
            var original = scope.exchange;

            // console.log('\noriginal', original +'');
            // console.log('exchange', exchange +'\n');

            exchange.source = original.source;
            exchange.property('callback', original.property('callback'));

            scope.data.deferred.resolve(exchange);
        }

        return exchange;
    }
};
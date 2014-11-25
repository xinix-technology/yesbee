/**
 * yesbee producer-template
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
var Exchange = require('./exchange'),
    Component = require('./component'),
    channel = require('./channel'),
    Channel = channel.Channel,
    Q = require('q');

var ProducerTemplate = function(context) {
    this.context = context;
    this.status = 0;
    this.id = ProducerTemplate.generateId();

    this.callbackChannel = this.id + '::OUT';
    this.scopes = {};
};

ProducerTemplate.ID = 0;
ProducerTemplate.generateId = function() {
    return 'producerTemplate-' + ProducerTemplate.ID++;
};

ProducerTemplate.prototype.start = function() {
    var that = this;
    this.context.on(this.callbackChannel, function() {
        that.callback.apply(that, arguments);
    });

    this.status = 1;
};

ProducerTemplate.prototype.stop = function() {
    this.status = 0;

    this.context.removeListener(this.callbackChannel);
};

ProducerTemplate.prototype.send = function(o, m) {
    var deferred = Q.defer(),
        exchange = this.createExchange(m);

    if (arguments.length < 2) {
        throw new Error('Send should define destination and message.');
    }

    var component = (o instanceof Component) ? o : this.context.lookup(o);

    if (!component) {
        throw new Error('Component to send to not found!');
    }

    if (component.options.exchangePattern === 'inOnly') {
        deferred.resolve();
    } else {
        exchange.property('callback', this.callbackChannel);

        this.scopes[exchange.id] = {
            exchange: exchange,
            deferred: deferred
        };
    }

    if (component && component.type == 'source') {
        this.context.send(Channel.IN, component, exchange, this);
    }

    return deferred.promise;
};

ProducerTemplate.prototype.callback = function(exchange) {
    var scope = this.scopes[exchange.id];
    if (scope) {
        scope.deferred.resolve(exchange);
    }
};

ProducerTemplate.prototype.createExchange = function(m) {
    if (m instanceof Exchange) {
        return m;
    }

    var exchange = new Exchange();
    exchange.body = m;
    return exchange;
};

ProducerTemplate.prototype.toString = function() {
    return '<' + this.id + '>';
};

module.exports = ProducerTemplate;
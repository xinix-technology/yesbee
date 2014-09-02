var Route = require('../route'),
    Channel = require('../channel'),
    Q = require('q'),
    _ = require('lodash');

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

    process: function(exchange) {
        var deferred = Q.defer(),
            that = this,
            callback = this.context.getChannelId(Channel.CALLBACK, this),
            whenExchange;

        this.scopes[exchange.id] = {
            deferred: deferred
        };


        _.find(this.processors, function(processor) {
            whenExchange = exchange.clone(true);
            whenExchange.property('callback', callback);
            whenExchange.property('origin-id', exchange.id);

            that.context.send(Channel.IN, processor, whenExchange, that);
        });

        // // console.log('IN ', exchange + '');
        // // console.log('OUT', whenExchange + '');

        // if (source.options.exchangePattern === 'inOut') {
        //     whenExchange.property('callback', callback);
        //     this.scopes[whenExchange.id] = {
        //         exchange: exchange,
        //         deferred: deferred
        //     };
        //     // this.scopes
        // } else {
        //     deferred.resolve(exchange);
        // }

        // this.context.send(Channel.CONSUMER, source, whenExchange, this);

        return deferred.promise;
    },
};
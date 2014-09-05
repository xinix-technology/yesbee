var Route = require('../route'),
    Channel = require('../channel'),
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
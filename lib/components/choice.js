var Route = require('../route'),
    Channel = require('../channel'),
    Q = require('q'),
    _ = require('lodash');

module.exports = {
    routes: [],

    start: function() {
        var that = this;

        this.scopes = {};

        this.constructor.prototype.start.apply(this, arguments);

        _.each(this.routes, function(route) {
            route.route.start();
        });

    },

    stop: function() {
        _.each(this.routes, function(route) {
            route.route.stop();
        });

        this.constructor.prototype.stop.apply(this, arguments);
    },

    when: function(expression) {
        if (this.endOfRules) {
            throw new Error('Cannot set when/otherwise after rules end');
        }
        this.routes.push({
            expression: expression,
            route: new Route(this.context)
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
        var last = this.routes[this.routes.length - 1];
        if (!last) {
            throw new Error('No context for new when/otherwise route');
        }

        if (last.route.source) {
            last.route.to(o, options);
        } else {
            last.route.from(o, options);
        }

        return this;
    },

    process: function(exchange) {
        var deferred = Q.defer(),
            route = _.find(this.routes, function(route) {
                return route.expression(exchange);
            }),
            source = route.route.source,
            callback = this.context.getChannelId(Channel.CALLBACK, this),
            whenExchange = exchange.clone(true);

        if (source.options.exchangePattern === 'inOut') {
            whenExchange.property('callback', callback);
            this.scopes[whenExchange.id] = {
                exchange: exchange,
                deferred: deferred
            };
        } else {
            deferred.resolve(exchange);
        }

        this.context.send(Channel.CONSUMER, source, whenExchange, this);

        return deferred.promise;
    },

    callback: function(exchange) {
        var scope = this.scopes[exchange.id];
        if (scope) {
            var original = scope.exchange;

            original.copyFrom(exchange, ['pattern']);

            scope.deferred.resolve(original);
        }
    }
};
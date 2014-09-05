var Route = require('../route'),
    Channel = require('../channel'),
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
var Channel = require('../channel'),
    Q = require('q');

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
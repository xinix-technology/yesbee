var Channel = require('../channel'),
    Q = require('q'),
    Exchange = require('../exchange'),
    later = require('later');

module.exports = {
    schedule: null,
    start: function() {

        if(!this.options.expression) {
            throw new Error('Cron need one expression.');
        }

        var cron = this.options.expression,
            s = later.parse.cron(cron),
            timeSched = later.schedule(s).next(),
            now = new Date().getTime(),
            that = this,
            fn = function() {
                var exchange = new Exchange();
                that.context.send(Channel.IN, that, exchange, that);
            };

        console.log(timeSched);
        that.schedule = setTimeout(fn, (timeSched.getTime() - now) );
        // that.schedule = setTimeout(fn, 3000 );
        this.constructor.prototype.start.apply(this, arguments);

    },

    // clear timeout
    stop: function() {
        this.constructor.prototype.stop.apply(this, arguments);
        clearTimeout(this.schedule);
        console.log('stopped');
    },

    process: function(exchange) {

        console.log('CRON: XXXX');

        // var outbound,
        //     deferred = Q.defer();

        // if (this.type !== 'source') {
        //     outbound = this.context.lookup(this.uri);

        //     var clonedExchange = exchange.clone();
        //     clonedExchange.property('callback', this.context.getChannelId(Channel.OUT, this));

        //     this.addScope(exchange, {
        //         deferred: deferred
        //     });

        //     this.send(Channel.IN, outbound, clonedExchange);
        // } else {
        //     deferred.resolve(exchange);
        // }

        // return deferred.promise;
    },

    // callback: function(exchange) {
    //     if (this.type !== 'source') {
    //         var scope = this.scopes[exchange.id];
    //         var original = scope.exchange;

    //         // console.log('\noriginal', original +'');
    //         // console.log('exchange', exchange +'\n');

    //         exchange.source = original.source;
    //         exchange.property('callback', original.property('callback'));

    //         scope.data.deferred.resolve(exchange);
    //     }

    //     return exchange;
    // }
};
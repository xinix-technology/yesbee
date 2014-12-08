var Q = require('q');

module.exports = function() {
    // var route = this.from('direct:in')
    //     .to('direct:preprocess?')
    //     .choice()
    //         .when(function(exchange) { return exchange.body == 'one'; } )
    //             .to('direct:one?exchangePattern=inOut')
    //             .to(function(exchange) {
    //                 var deferred = Q.defer();
    //                 setTimeout(function() {
    //                     console.log('------------------------------------------------');
    //                     exchange.body = 'nonono-1';
    //                     deferred.resolve(exchange);
    //                 }, 1000);
    //                 return deferred.promise;
    //             })
    //         .when(function(exchange) { return exchange.body == 'two'; } )
    //             .to('direct:two')
    //             .to(function(exchange) {
    //                 var deferred = Q.defer();
    //                 setTimeout(function() {
    //                     console.log('------------------------------------------------');
    //                     exchange.body = 'nonono-2';
    //                     deferred.resolve(exchange);
    //                 }, 1000);
    //                 return deferred.promise;
    //             })
    //         .otherwise().to('direct:otherwise')
    //     .end()
    //     .to('direct:out');

    var route = this.from('direct:in')
        .choice()
            .when(function(exchange) { return exchange.body == 'one'; } )
                .to(function(exchange) {
                    exchange.body = 'satu';
                })
            .when(function(exchange) { return exchange.body == 'two'; } )
                .to('direct:two')
                // .to(function(exchange) {
                //     exchange.body = 'dua';
                // })
            .otherwise()
                .to(function(exchange) {
                    exchange.body = 'other';
                })
        .end()
        .to(function() {

        });

    this.from('direct:two?exchangePattern=inOut')
        .to(function(exchange) {
            exchange.body = 'dua';
        });

    this.trace = true;

    var template = this.createProducerTemplate();

    setImmediate(function() {
        // template.send('direct:in', 'one');
        // template.send('direct:in', 'two');
        template.send('direct:in', 'three');
    });
};
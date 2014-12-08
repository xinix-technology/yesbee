var Q = require('q');

module.exports = function() {
    var route = this.from('direct:in?exchangePattern=inOut')
        .multicast()
            .to(function(exchange) {
                exchange.header('satu', 1);
                return exchange;
            })
            .to(function(exchange) {
                exchange.header('dua', 2);
                return exchange;
            })
        .end()
        .to(function() {
            console.log('xxx');
        });

    // this.trace = true;

    var template = this.createProducerTemplate();

    setImmediate(function() {
        template.send('direct:in', 'one').then(function(exchange) {
            console.log(exchange + '');
        });
        // template.send('direct:in', 'two');
        // template.send('direct:in', 'three');
    });
};
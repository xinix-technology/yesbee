var Q = require('q');

module.exports = function() {
    var route = this.from('direct:in?exchangePattern=inOut')
        .to('direct:preprocess')
        .to(function(exchange) {
            return exchange;
        })
        // .to(function(exchange) {})
        ;

    this.from('direct:preprocess?exchangePattern=inOut')
        .to(function() {})
        .to('direct:after')
        ;

    this.from('direct:after?exchangePattern=inOut')
        .to(function() {})
        ;

    this.trace = true;

    var template = this.createProducerTemplate();

    setImmediate(function() {
        template.send('direct:in', 'date:' + new Date());
        // template.send('direct:in', 'two');
        // template.send('direct:in', 'three');
    });
};

/**


direct:in -> {
    source: direct:in
}
direct:pre -> {

}
    direct:pre -> {
        source: direct:pre
    }
    process: -> {
        source: direct:pre
    }
    direct:pre -> {
        source: direct:pre
    }





 */
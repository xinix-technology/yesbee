var Context = require('../lib/context');

var context = new Context();

var route = context.from('direct:input')
    .to(function(exchange) {
        return exchange;
    })
    .to(function(exchange) {
        return exchange;
    });

// var route = context.from('direct:input')
//     .to('direct:satu')
//     .to('direct:dua')
//     .to('direct:output');


context.trace = true;
context.start();

var template = context.createProducerTemplate();

var ex = template.createExchange('direct:input', 'test-' + new Date());
ex.pattern = 'inOut';
template.send('direct:input', ex);

// template.send('direct:input', 'test-' + new Date());
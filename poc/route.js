var Context = require('../lib/context');

var context = new Context();

var route = context.from('mock:input')
    .to(function(exchange) {
        return exchange;
    })
    .to(function(exchange) {
        return exchange;
    });

// var route = context.from('mock:input')
//     .to('mock:satu')
//     .to('mock:dua')
//     .to('mock:output');


context.trace = true;
context.start();

var template = context.createProducerTemplate();

var ex = template.createExchange('mock:input', 'test-' + new Date());
ex.pattern = 'inOut';
template.send('mock:input', ex);

// template.send('mock:input', 'test-' + new Date());
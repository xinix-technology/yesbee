var Context = require('../lib/context');

var context = new Context();

var route = context.from('mock:input')
    .to('mock:satu')
    .to('mock:dua')
    .to('mock:output');


context.trace = true;
context.start();

var template = context.createProducerTemplate();
template.send('mock:input', 'test-' + new Date());
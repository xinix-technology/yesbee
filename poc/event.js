var Context = require('./lib/context');

var context = new Context();

// var route = context.from('mock:input')
    // .to('mock:output');

context.on('xxx', function() {
    console.log('xxx');
});

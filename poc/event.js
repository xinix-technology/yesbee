var Context = require('./lib/context');

var context = new Context();

// var route = context.from('direct:input')
    // .to('direct:output');

context.on('xxx', function() {
    console.log('xxx');
});

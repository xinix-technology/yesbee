// var http = require('http');

// var s = http.createServer(function(req, res) {
//     res.end('Hello world\n');

// });

// // var s2 = http.createServer(function(req, res) {
// //     res.end('Hello world2\n');

// // });

// s.listen(3000);
// s.listen(3001);

var Component = require('../lib/component'),
    Context = require('../lib/context');


var context = new Context();

var route = context.from('http-inbound:http://localhost:3000/anu/itu')
    .to(function(exchange) {
        console.log('xxxxx', exchange);
    });


context.trace = true;
context.start();
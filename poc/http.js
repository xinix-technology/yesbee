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
    Context = require('../lib/context'),
    Q = require('q');


var context = new Context();

var route = context.from('http-inbound:http://localhost:3000?timeout=2000')
    .to(function(exchange) {
        console.log('h', exchange.headers);
        console.log('b', exchange.body);
        // var deferred = Q.defer();

        // setTimeout(function() {
        //     exchange.body = 'Test aja ' + new Date();
        //     deferred.resolve(exchange);
        // }, 1000);

        // return deferred.promise;

        // return exchange;
    });


// context.trace = true;
context.start();
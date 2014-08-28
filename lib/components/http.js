var Q = require('q'),
    request = require('request');

module.exports = {
    process: function(exchange) {
        var deferred = Q.defer();
        // console.log(exchange.headers);
        request(this.uri + exchange.headers['x-translated-uri'], function(err, res, body) {
            if (!err && res.statusCode == 200) {
                exchange.body = body;
            } else {
                exchange.error = new Error('HTTP error!');
            }
            deferred.resolve(exchange);
        });
        return deferred.promise;
    }
};
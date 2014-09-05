var Q = require('q'),
    request = require('request');

module.exports = {
    process: function(exchange) {
        var deferred = Q.defer();
        request(this.uri + exchange.headers['yesbee-translated-uri'], function(err, res, body) {
            if (!err && res.statusCode == 200) {
                exchange.body = body;
            } else {
                exchange.error = new Error('HTTP error!');
                exchange.error.statusCode = res.statusCode;
            }
            deferred.resolve(exchange);
        });
        return deferred.promise;
    }
};
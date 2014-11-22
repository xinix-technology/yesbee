var Q = require('q'),
    _ = require('lodash'),
    request = require('request'),
    Channel = require('../channel');

module.exports = {

    getSocketioService: function() {

        var socketioService = this.context.getService('socketio');
        if (!socketioService) {
            throw new Error('Service "http" is not running');
        }

        return socketioService;
    },

    start: function() {
        if (this.type === 'source') {
            // if(this.options.proxyAuthHost) this.uri = this.options.proxyAuthHost + ((this.options.proxyAuthPort) ? ':'+this.options.proxyAuthPort : '');
            this.options = _.defaults(this.options || {}, {exchangePattern: 'inOut'});
            var socketioService = this.getSocketioService().attach(this.uri, this);
        }
        this.constructor.prototype.start.apply(this, arguments);
    },

    stop: function() {
        if (this.type === 'source') {
            this.getSocketioService().detach(this.uri, this);
        }
        this.constructor.prototype.stop.apply(this, arguments);
    },

    // process: function(exchange) {

    //     console.log('WS::', 'process');

    //     if (this.type === 'source') {
    //         return exchange;
    //     } else {

    //         var deferred = Q.defer();

    //         if (this.options.proxy) {

    //             if (exchange.body.pipe) {
    //                 var resp = exchange.body.pipe(request({method: exchange.body.method, uri: this.uri + exchange.body.url}));
    //                 exchange.body = resp;
    //                 deferred.resolve(exchange);
    //             } else {
    //                 throw new Error('Unimplemented yet!');
    //             }

    //         } else {

    //             if(exchange.headers['yesbee-request-method'] == 'GET') {

    //                 request(this.uri + exchange.headers['yesbee-translated-uri'], function(err, res, body) {

    //                     if (!err && res.statusCode == 200) {
    //                         exchange.body = body;
    //                     } else {
    //                         exchange.error = new Error('HTTP error!');
    //                         exchange.error.statusCode = res.statusCode;
    //                     }
    //                     deferred.resolve(exchange);
    //                 });

    //             } else {

    //                 var _data = {};
    //                 if(typeof exchange.body == "object") _data = exchange.body;

    //                 request({
    //                     method: exchange.headers['yesbee-request-method'],
    //                     uri: this.uri + exchange.headers['yesbee-translated-uri'],
    //                     form: _data
    //                 }, function(err, res, body) {

    //                     if (!err && res.statusCode == 200) {
    //                         exchange.body = body;
    //                     } else {
    //                         exchange.error = new Error('HTTP error!');
    //                         exchange.error.statusCode = res.statusCode;
    //                     }
    //                     deferred.resolve(exchange);
    //                 });


    //             }

    //         }

    //         return deferred.promise;

    //     }
    // }
};
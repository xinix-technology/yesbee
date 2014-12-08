/**
 * yesbee components/http
 *
 * MIT LICENSE
 *
 * Copyright (c) 2014 PT Sagara Xinix Solusitama - Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @author     Ganesha <reekoheek@gmail.com>
 * @copyright  2014 PT Sagara Xinix Solusitama
 */
var Q = require('q'),
    _ = require('lodash'),
    request = require('request'),
    channel = require('../channel'),
    Channel = channel.Channel;

module.exports = {
    // options: {exchangePattern: 'inOut'},

    getHttpService: function() {
        var httpService = this.context.getService('http');
        if (!httpService) {
            throw new Error('Service "http" is not running');
        }

        return httpService;
    },

    start: function() {
        if (this.type === 'source') {
            // if(this.options.proxyAuthHost) this.uri = this.options.proxyAuthHost + ((this.options.proxyAuthPort) ? ':'+this.options.proxyAuthPort : '');
            this.options = _.defaults(this.options || {}, {exchangePattern: 'inOut'});
            this.getHttpService().attach(this.uri, this);
        }
        this.constructor.prototype.start.apply(this, arguments);
    },

    stop: function() {
        if (this.type === 'source') {
            // var uri = this.uri.substr(this.uri.indexOf(':') + 1);
            this.getHttpService().detach(this.uri, this);
        }
        this.constructor.prototype.stop.apply(this, arguments);
    },

    process: function(exchange) {

        if (this.type === 'source') {
            return exchange;
        } else {

            var deferred = Q.defer();

            if (this.options.proxy) {

                if (exchange.body.pipe) {
                    var resp = exchange.body.pipe(request({method: exchange.body.method, uri: this.uri + exchange.body.url}));
                    exchange.body = resp;
                    deferred.resolve(exchange);
                } else {
                    throw new Error('Unimplemented yet!');
                }

            } else {

                var _data = {};

                if (exchange.headers['yesbee-request-method'] == 'GET') {

                    request(this.uri + exchange.headers['yesbee-translated-uri'], function(err, res, body) {

                        if (!err && res.statusCode == 200) {
                            exchange.body = body;
                        } else {
                            exchange.error = new Error('HTTP error!');
                            exchange.error.statusCode = res.statusCode;
                        }
                        deferred.resolve(exchange);
                    });

                } else if(exchange.headers['yesbee-request-method'] == 'PUT' && exchange.headers['yesbee-request-multipart'] === true) {

                    if(typeof exchange.body == "object") _data = JSON.stringify(exchange.body); // json
                    if(typeof exchange.body == "string") _data = exchange.body;

                    request({
                        method: exchange.headers['yesbee-request-method'],
                        uri: this.uri + exchange.headers['yesbee-translated-uri'],
                        multipart: [ { body: _data } ],
                    }, function(err, res, body) {

                        console.log(body);

                        if (!err && res.statusCode == 200) {
                            exchange.body = body;
                        } else {
                            exchange.error = new Error('HTTP error!');
                            exchange.error.statusCode = res.statusCode;
                        }
                        deferred.resolve(exchange);
                    });

                } else {

                    if(typeof exchange.body == "object") _data = exchange.body;

                    request({
                        method: exchange.headers['yesbee-request-method'],
                        uri: this.uri + exchange.headers['yesbee-translated-uri'],
                        form: _data
                    }, function(err, res, body) {

                        if (!err && res.statusCode == 200) {
                            exchange.body = body;
                        } else {
                            exchange.error = new Error('HTTP error!');
                            exchange.error.statusCode = res.statusCode;
                        }
                        deferred.resolve(exchange);
                    });
                }
            }
            return deferred.promise;
        }
    }
};
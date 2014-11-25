/**
 * yesbee exchange
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
var uuid = require('node-uuid'),
    _ = require('lodash');


var Exchange = function() {
    this.clazz = '$exchange';
    this.id = Exchange.generateId();

    this.pattern = null;
    this.error = null;
    this.headers = {};
    this.properties = {};
    this.body = '';
    this.source = null;
};

Exchange.generateId = function() {
    return 'exchange/' + uuid.v1();
};

Exchange.clone = function(original, newId) {
    var exchange = new Exchange(),
        id = exchange.id;

    _.extend(exchange, original);

    exchange.headers = _.clone(original.headers);
    exchange.properties = _.clone(original.properties);

    // should we clone body?
    // exchange.body = _.clone(original.body);

    if (newId) {
        exchange.id = id;
    }

    return exchange;
};

Exchange.prototype.copyFrom = function(exchange, excludes) {
    excludes = excludes || [];

    var that = this;

    _.each(exchange, function(v, k) {
        if (k === 'clazz' ||
            k === 'id' ||
            k === 'source') return;

        var found = _.find(excludes, function(i) {
            return i == k;
        });

        if (found) return;

        that[k] = v;
    });
};

Exchange.prototype.header = function(key, value) {
    if (arguments.length > 1) {
        this.headers[key] = value;
    } else if (arguments.length === 0) {
        return this.headers;
    } else if (typeof key == 'string') {
        return this.headers[key];
    } else {
        for(var i in key) {
            this.header(i, key[i]);
        }
    }
};

Exchange.prototype.removeHeader = function(key) {
    if (typeof this.headers[key] !== 'undefined') {
        delete this.headers[key];
    }
};

Exchange.prototype.property = function(key, value) {
    if (arguments.length > 1) {
        this.properties[key] = value;
    } else if (arguments.length === 0) {
        return this.properties;
    } else if (typeof key == 'string') {
        return this.properties[key];
    } else {
        for(var i in key) {
            this.property(i, key[i]);
        }
    }
};

Exchange.prototype.toString = function() {
    var s = [],
        vString;

    _.each(this, function(v, k) {
        if (k == 'headers' || k == 'properties') {

            var hs = [];
            _.each(v, function(hv, hk) {
                if (typeof hv === 'function') {
                    hv = '[f Function]';
                }
                hs.push(hk + '=' + hv);
            });

            vString = hs.join(', ');
            if (vString.length > 100) {
                vString = vString.substr(0, 100) + '...';
            }
            s.push(k + '={' + vString + '}');
        } else {
            vString = v + '';
            if (vString.length > 100) {
                vString = vString.substr(0, 100) + '...';
            }
            s.push(k + '=' + vString);
        }
    });

    return '[' + s.join(' ') + ']';
};

Exchange.prototype.clone = function(newId) {
    return Exchange.clone(this, newId);
};

module.exports = Exchange;
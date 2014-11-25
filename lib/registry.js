/**
 * yesbee registry
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
var _ = require('lodash');

var Registry = function() {
    this.data = {};
};

// Registry.instance = new Registry();

// Registry.create = function() {
//     return Registry.instance;
// };

Registry.prototype.put = function(k, v) {
    if (typeof k !== 'string') {
        throw new Error('First argument should be string');
    }

    if (typeof v == 'undefined' && this.data[k]) {
        delete this.data[k];
    } else {
        this.data[k] = v;
    }
};

Registry.prototype.get = function(k) {
    if (typeof k !== 'string') {
        throw new Error('First argument should be string');
    }
    return this.data[k];
};

Registry.prototype.find = function(k) {
    if (typeof k !== 'string') {
        throw new Error('First argument should be string');
    }

    var segments = k.split('::'),
        sk = _.map(segments, function(segment) {
            if (segment === '*') {
                return '((?!::).)*';
            }
            return segment;
        });

    var regex = '^' + sk.join('::') + '$',
        result = _.filter(this.data, function(v, k) {
            var match = (new RegExp(regex, 'g')).test(k);
            return match;
        });
    return result;
};

var registry = module.exports = new Registry();
registry.Registry = Registry;
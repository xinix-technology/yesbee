var _ = require('lodash');

var Registry = function() {
    this.data = {};
};

Registry.instance = new Registry();

Registry.create = function() {
    return Registry.instance;
};

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

module.exports = Registry;
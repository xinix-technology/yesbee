var uuid = require('node-uuid'),
    _ = require('lodash');


var Exchange = function() {
    this.clazz = '$exchange';
    this.id = Exchange.generateId();

    this.pattern = 'inOnly';
    this.error = null;
    this.headers = {};
    this.properties = {};
    this.body = '';
    this.source = null;
};

Exchange.generateId = function() {
    return 'exchange/' + uuid.v1();
};

Exchange.clone = function(original, sameId) {
    if (typeof sameId == 'undefined') {
        sameId = true;
    }

    var exchange = new Exchange(),
        id = exchange.id;

    _.extend(exchange, original);

    exchange.headers = _.clone(original.headers);

    // should we clone body?
    // exchange.body = _.clone(original.body);

    if (!sameId) {
        exchange.id = id;
    }

    return exchange;
};

Exchange.prototype = {
    header: function(key, value) {
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
    },

    property: function(key, value) {
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
    },

    toString: function() {
        var s = [],
            vString;

        _.each(this, function(v, k) {
            if (k == 'headers' || k == 'properties') {

                var hs = [];
                _.each(v, function(hv, hk) {
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
    },

    clone: function(sameId) {
        return Exchange.clone(this, sameId);
    }
};

module.exports = Exchange;
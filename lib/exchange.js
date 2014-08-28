var uuid = require('node-uuid');


var Exchange = function() {
    this.type = '$exchange';
    this.id = Exchange.generateId();

    this.pattern = 'inOnly';
    this.headers = {};
    this.body = '';
};

Exchange.generateId = function() {
    return 'exchange/' + uuid.v1();
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
    }
};

module.exports = Exchange;
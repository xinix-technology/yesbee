var Channel = require('../channel');

module.exports = {
    process: function(exchange) {
        var outbound;

        if (this.type !== 'source') {
            outbound = this.context.lookup(this.uri);
        }

        if (outbound) {
            this.send(Channel.IN, outbound, exchange);
        }
    },

    consume: function(exchange) {
        this.send(Channel.IN, this, exchange);
    }
};
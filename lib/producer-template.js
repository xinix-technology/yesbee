var Exchange = require('./exchange');

var ProducerTemplate = function(context) {
    this.context = context;
};

ProducerTemplate.prototype = {
    send: function(o, m) {
        if (arguments.length < 2) {
            throw new Error('Send should define destination and message.');
        }

        this.context.emit(this.getInputChannel(o), this.createExchange(m));
    },

    getInputChannel: function(o) {
        return o + '::in';
    },

    createExchange: function(m) {
        if (m instanceof Exchange) {
            return m;
        }

        var exchange = new Exchange();
        exchange.body = m;
        return exchange;
    }
};

module.exports = ProducerTemplate;
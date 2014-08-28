var Exchange = require('./exchange');

var ProducerTemplate = function(context) {
    this.context = context;
};

ProducerTemplate.prototype = {
    send: function(o, m) {
        this.context.emit(this.getInputChannel(o), this.createExchange(m));
    },

    getInputChannel: function(o) {
        return o + '::in';
    },

    createExchange: function(m) {
        var exchange = new Exchange();
        exchange.body = m;
        return exchange;
    }
};

module.exports = ProducerTemplate;
var Exchange = require('./exchange');

var ProducerTemplate = function(context) {
    this.context = context;
    this.status = 0;
};

ProducerTemplate.prototype.start = function() {
    this.status = 1;
};

ProducerTemplate.prototype.stop = function() {
    this.status = 0;
};

ProducerTemplate.prototype.send = function(o, m) {
    if (arguments.length < 2) {
        throw new Error('Send should define destination and message.');
    }

    this.context.emit(this.getInputChannel(o), this.createExchange(m));
};

ProducerTemplate.prototype.getInputChannel = function(o) {
    return o + '::in';
};

ProducerTemplate.prototype.createExchange = function(m) {
    if (m instanceof Exchange) {
        return m;
    }

    var exchange = new Exchange();
    exchange.body = m;
    return exchange;
};

module.exports = ProducerTemplate;
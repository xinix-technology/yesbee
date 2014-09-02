var Exchange = require('./exchange'),
    Component = require('./component'),
    Channel = require('./channel');

var ProducerTemplate = function(context) {
    this.context = context;
    this.status = 0;
    this.id = ProducerTemplate.generateId();
};

ProducerTemplate.ID = 0;
ProducerTemplate.generateId = function() {
    return 'producerTemplate-' + ProducerTemplate.ID++;
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

    var component = (o instanceof Component) ? o : this.context.lookup(o);

    if (component && component.type == 'source') {
        this.context.send(Channel.CONSUMER, component, this.createExchange(m), this);
    }

};

ProducerTemplate.prototype.createExchange = function(m) {
    if (m instanceof Exchange) {
        return m;
    }

    var exchange = new Exchange();
    exchange.body = m;
    return exchange;
};

ProducerTemplate.prototype.toString = function() {
    return '<' + this.id + '>';
};

module.exports = ProducerTemplate;
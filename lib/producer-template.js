var Exchange = require('./exchange'),
    Component = require('./component'),
    Channel = require('./channel'),
    Q = require('q');

var ProducerTemplate = function(context) {
    this.context = context;
    this.status = 0;
    this.id = ProducerTemplate.generateId();

    this.callbackChannel = this.id + '::OUT';
    this.scopes = {};
};

ProducerTemplate.ID = 0;
ProducerTemplate.generateId = function() {
    return 'producerTemplate-' + ProducerTemplate.ID++;
};

ProducerTemplate.prototype.start = function() {
    var that = this;
    this.context.on(this.callbackChannel, function() {
        that.callback.apply(that, arguments);
    });

    this.status = 1;
};

ProducerTemplate.prototype.stop = function() {
    this.status = 0;

    this.context.removeListener(this.callbackChannel);
};

ProducerTemplate.prototype.send = function(o, m) {
    var deferred = Q.defer(),
        exchange = this.createExchange(m);

    if (arguments.length < 2) {
        throw new Error('Send should define destination and message.');
    }

    var component = (o instanceof Component) ? o : this.context.lookup(o);

    if (!component) {
        throw new Error('Component to send to not found!');
    }

    if (component.options.exchangePattern === 'inOnly') {
        deferred.resolve();
    } else {
        exchange.property('callback', this.callbackChannel);

        this.scopes[exchange.id] = {
            exchange: exchange,
            deferred: deferred
        };
    }

    if (component && component.type == 'source') {
        this.context.send(Channel.IN, component, exchange, this);
    }

    return deferred.promise;
};

ProducerTemplate.prototype.callback = function(exchange) {
    var scope = this.scopes[exchange.id];
    if (scope) {
        scope.deferred.resolve(exchange);
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
var Channel = require('../channel');

module.exports = {
    options: {
        exchangePattern: 'inOut',
        timeout: 30000,
    },

    scopes: {},

    getHttpService: function() {
        var httpService = this.context.getService('http');
        if (!httpService) {
            throw new Error('Service "http" is not running');
        }

        return httpService;
    },

    start: function() {
        this.constructor.prototype.start.apply(this, arguments);

        this.scopes = {};

        var uri = this.uri.substr(this.uri.indexOf(':') + 1);

        this.getHttpService().attach(uri, this);
    },

    stop: function() {
        var uri = this.uri.substr(this.uri.indexOf(':') + 1);

        this.getHttpService().detach(uri, this);

        this.constructor.prototype.stop.apply(this, arguments);
    },

    consume: function(exchange) {
        var that = this,
            timeout;

        this.send(Channel.IN, this, exchange);

        var callbackExchange = exchange.clone(true);
        var callbackChannel = exchange.property('callback');

        if (callbackChannel) {
            if (exchange.pattern === 'inOnly') {
                callbackExchange.body = exchange.header('yesbee-request-method') + ' ' + exchange.header('yesbee-translated-path');
                this.context.getChannel().emit(callbackChannel, callbackExchange);
            } else {
                timeout = setTimeout(function() {
                    that.removeScope(exchange);

                    callbackExchange.error = new Error('Timeout executing flow');
                    that.context.getChannel().emit(callbackChannel, callbackExchange);

                }, this.options.timeout);

                this.addScope(exchange, timeout);
            }
        }
    },

    addScope: function(exchange, timeout) {
        this.scopes[exchange.id] = {
            timeout: timeout,
            exchange: exchange
        };
    },

    removeScope: function(exchange) {
        if (this.scopes[exchange.id]) {
            if (this.scopes[exchange.id].timeout) {
                clearTimeout(this.scopes[exchange.id].timeout);
            }
            delete this.scopes[exchange.id];
        }
    },

    result: function(exchange) {
        var scope = this.scopes[exchange.id];

        if (scope) {
            this.removeScope(exchange);
            this.constructor.prototype.result.apply(this, arguments);
        }
    }
};
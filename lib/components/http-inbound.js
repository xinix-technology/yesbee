var Channel = require('../channel');

module.exports = {
    options: {
        exchangePattern: 'inOut',
    },

    getHttpService: function() {
        var httpService = this.context.getService('http');
        if (!httpService) {
            throw new Error('Service "http" is not running');
        }

        return httpService;
    },

    start: function() {
        this.constructor.prototype.start.apply(this, arguments);

        var uri = this.uri.substr(this.uri.indexOf(':') + 1);

        this.getHttpService().attach(uri, this);
    },

    stop: function() {
        var uri = this.uri.substr(this.uri.indexOf(':') + 1);

        this.getHttpService().detach(uri, this);

        this.constructor.prototype.stop.apply(this, arguments);
    }

};
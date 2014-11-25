var Q = require('q'),
    _ = require('lodash'),
    request = require('request'),
    channel = require('../channel'),
    Channel = channel.Channel;

module.exports = {

    getSocketioService: function() {

        var socketioService = this.context.getService('socketio');
        if (!socketioService) {
            throw new Error('Service "http" is not running');
        }

        return socketioService;
    },

    start: function() {
        if (this.type === 'source') {
            // if(this.options.proxyAuthHost) this.uri = this.options.proxyAuthHost + ((this.options.proxyAuthPort) ? ':'+this.options.proxyAuthPort : '');
            this.options = _.defaults(this.options || {}, {exchangePattern: 'inOut'});
            var socketioService = this.getSocketioService().attach(this.uri, this);
        }
        this.constructor.prototype.start.apply(this, arguments);
    },

    stop: function() {
        if (this.type === 'source') {
            this.getSocketioService().detach(this.uri, this);
        }
        this.constructor.prototype.stop.apply(this, arguments);
    }
};
var channel = require('../channel'),
    Channel = channel.Channel,
    Q = require('q'),
    Exchange = require('../exchange');

module.exports = {
    schedule: null,
    start: function() {
        this.constructor.prototype.start.apply(this, arguments);
    },

    stop: function() {
        this.constructor.prototype.stop.apply(this, arguments);
    },

    process: function(exchange) {

        if(!this.options.eventName) {
            throw new Error("Socketio need event name to emit event.");
        }

        var uri = this.uri.replace('socketio-emit', 'socketio');
        exchange.headers['socketio-session-id'] = exchange.headers['socketio-session-id'] || exchange.headers['http-socketio-session-id'] || null;
        var id = exchange.headers['socketio-session-id'];
        var socket = this.context.getService('socketio');

        socket.getSocketById(id).emit(this.options.eventName, exchange.body);
    }

};
var Channel = require('../channel'),
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
        exchange.headers['socketio-session-id'] = exchange.headers['http-socketio-session-id'];
        var id = exchange.headers['http-socketio-session-id'];
        // FIXME emit event lebih dari satu ketika mencoba reconnect
        // this.context.getService('http').get(uri).io.sockets.connected[id].emit(this.options.eventName);
        // this.context.getService('socketio').get(uri).io.sockets.connected[id].emit(this.options.eventName);
        var socket = this.context.getService('socketio');
        console.log('SOCKETIO::', socket.data);
        socket.getSocketById(id).emit(this.options.eventName, socket.data);
    }

};
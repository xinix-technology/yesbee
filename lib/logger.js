var winston = require('winston');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: true,
    colorize: true
});

module.exports = {
    d: function(channel, data) {
        if (arguments.length == 1) {
            data = channel;
            channel = '<common>';
        }
        winston.log('debug', channel, data);
    },

    i: function(channel, data) {
        if (arguments.length == 1) {
            data = channel;
            channel = '<common>';
        }
        winston.log('info', channel, data);
    },

    e: function(channel, data) {
        if (arguments.length == 1) {
            data = channel;
            channel = '<common>';
        }
        winston.log('error', channel, data);
    },

    p: function() {
        console.log.apply(console, arguments);
    },

    pe: function(channel, data) {
        console.error.apply(console, arguments);
    }
};
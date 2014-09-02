var winston = require('winston');

var customLogger = winston;
// var customLogger = new (winston.Logger)({
//   levels: {
//     trace: 0,
//     input: 1,
//     verbose: 2,
//     prompt: 3,
//     debug: 4,
//     info: 5,
//     data: 6,
//     help: 7,
//     warn: 8,
//     error: 9
//   },
//   colors: {
//     trace: 'magenta',
//     input: 'grey',
//     verbose: 'cyan',
//     prompt: 'grey',
//     debug: 'blue',
//     info: 'green',
//     data: 'grey',
//     help: 'cyan',
//     warn: 'yellow',
//     error: 'red'
//   }
// });
// customLogger.add(winston.transports.Console, {
//   level: 'trace',
//   prettyPrint: true,
//   colorize: true,
//   silent: false,
//   timestamp: true,
//   json: false
// });

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
        customLogger.log('debug', channel, data);
    },

    i: function(channel, data) {
        if (arguments.length == 1) {
            data = channel;
            channel = '<common>';
        }
        customLogger.log('info', channel, data);
    },

    e: function(channel, data) {
        if (arguments.length == 1) {
            data = channel;
            channel = '<common>';
        }
        customLogger.log('error', channel, data);
    },

    p: function() {
        console.log.apply(console, arguments);
    },

    pe: function(channel, data) {
        console.error.apply(console, arguments);
    }
};
/**
 * yesbee logger
 *
 * MIT LICENSE
 *
 * Copyright (c) 2014 PT Sagara Xinix Solusitama - Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @author     Ganesha <reekoheek@gmail.com>
 * @copyright  2014 PT Sagara Xinix Solusitama
 */
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
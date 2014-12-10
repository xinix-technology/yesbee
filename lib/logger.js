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
var winston = require('winston'),
    clc = require('cli-color');

var tracer = new (winston.Logger)({
    levels: {
        trace: 0,
        // input: 1,
        // verbose: 2,
        // prompt: 3,
        // debug: 4,
        // info: 5,
        // data: 6,
        // help: 7,
        // warn: 8,
        // error: 9
    },
    colors: {
        trace: 'yellow',
        // input: 'grey',
        // verbose: 'cyan',
        // prompt: 'grey',
        // debug: 'blue',
        // info: 'green',
        // data: 'grey',
        // help: 'cyan',
        // warn: 'yellow',
        // error: 'red'
    }
});
tracer.add(winston.transports.Console, {
    level: 'trace',
    prettyPrint: true,
    colorize: true,
    silent: false,
    timestamp: false,
    json: false
});

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: false,
    colorize: true
});

var colType = clc.yellowBright,
    colContext = clc.bold.blue;
module.exports = {
    id: 0,
    debug: false,
    rt: function(channel, data, meta) {
        // console.log('<--------------------------------------------------------');
        tracer.trace(colType('%s') + clc.magentaBright(' %s ') + colType('>>') + clc.greenBright(' %s') + colType('\n[channel] ') + '%s', data.type, data.from, data.to, data.channel);
        if(meta.error) console.log(clc.red(meta + ''));
        else console.log(clc.yellow(meta + ''));
        // console.log('-------------------------------------------------------->');
    },

    d: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (arguments.length == 1) {
            args.unshift('-');
        }
        args[0] = this.formatId() + ' [' + clc.bold.blueBright(args[0]) + ']';

        winston.debug.apply(winston, args);
    },

    i: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (arguments.length == 1) {
            args.unshift('-');
        }
        args[0] = this.formatId() + ' [' + clc.bold.blueBright(args[0]) + ']';

        winston.info.apply(winston, args);
    },

    w: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (arguments.length == 1) {
            args.unshift('-');
        }
        args[0] = this.formatId() + ' [' + clc.bold.blueBright(args[0]) + ']';

        winston.warn.apply(winston, args);
    },

    e: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (arguments.length == 1) {
            args.unshift('-');
        }
        args[0] = this.formatId() + ' [' + clc.bold.blueBright(args[0]) + ']';

        winston.error.apply(winston, args);
        if (this.debug) {
            var e = arguments[arguments.length - 1];
            if (e instanceof Error) {
                console.log(clc.yellowBright('[stacktrace] ') + clc.red(e.stack));
            }
        }
    },

    p: function() {
        console.log.apply(console, arguments);
    },

    formatId: function() {
        if (!this.formatId_) {
            this.formatId_ = clc.yellowBright('#') + clc.blueBright(this.id);
        }
        return this.formatId_;
    }

    // pe: function() {
    //     console.error.apply(console, arguments);
    // }
};
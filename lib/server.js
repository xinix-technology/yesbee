/**
 * yesbee server
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
var net = require('net'),
    Q = require('q'),
    logger = require('./logger'),
    _ = require('lodash'),
    Table = require('easy-table');

var val = function(v) {
    return (typeof v === 'function') ? v() : v;
};

var Server = function(container) {
    var that = this;

    var version = require('../package').version;

    this.container = container;
    this.port = container.prop('port');
    this.host = container.prop('host');
    this.motd = container.prop('motd') || (
        '                     __            \n' +
        '    __  _____  _____/ /_  ___  ___ \n' +
        '   / / / / _ \\/ ___/ __ \\/ _ \\/ _ \\\n' +
        '  / /_/ /  __(__  ) /_/ /  __/  __/\n' +
        '  \\__, /\\___/____/_.___/\\___/\\___/ \n' +
        ' /____/                    v' + version + '\n'
    );
    this.prompt = '#' + container.prop('worker') + (container.prop('prompt') || '> ');

    this.s = net.createServer(function(c) {
        var remoteAddress = c.remoteAddress,
            remotePort = c.remotePort;

        logger.i('- Client connected from %s:%s', remoteAddress, remotePort);

        c.container = container;

        c.setEncoding('utf-8');

        c.writePrompt = function() {
            c.write(val(that.prompt));
        };

        c.write(val(that.motd) + '\n');
        c.writePrompt();

        c.on('data', function(data) {
            data = data.trim();

            if (!data) {
                c.writePrompt();
                return;
            }

            var segments = data.split(/\s+/),
                method = segments[0];

            segments.shift();

            try {
                var retval = require('./commands/' + method).apply(c, segments);
                if (retval === false) {
                    return;
                }
            } catch(e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    c.write('Command not found, type "help" to see available commands!\n');
                }
            }

            c.writePrompt();

        });

        c.on('end', function() {
            logger.i('- Client disconnected from %s:%s', remoteAddress, remotePort);
        });
    });
};

Server.prototype.listen = function() {
    var deferred = Q.defer(),
        that = this;

    this.s.listen(this.port, this.host, function() {
        deferred.resolve(that.s);
    });

    return deferred.promise;
};

Server.prototype.close = function() {
    this.s.close();
};

module.exports = Server;
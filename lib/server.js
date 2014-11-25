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

    this.container = container;
    this.port = container.prop('port');
    this.host = container.prop('host');
    this.prompt = container.prop('prompt') || '> ';

    this.s = net.createServer(function(c) {
        c.container = container;

        c.setEncoding('utf-8');

        c.write(val(that.motd));
        c.write(val(that.prompt));

        c.on('data', function(data) {
            data = data.trim();

            if (!data) {
                c.write(val(that.prompt));
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

            c.write(val(that.prompt));

        });

        c.on('end', function() {
            logger.i('Client disconnected');
        });
    });
};

Server.prototype.motd = function() {
    return (
        '                     __            \n' +
        '    __  _____  _____/ /_  ___  ___ \n' +
        '   / / / / _ \\/ ___/ __ \\/ _ \\/ _ \\\n' +
        '  / /_/ /  __(__  ) /_/ /  __/  __/\n' +
        '  \\__, /\\___/____/_.___/\\___/\\___/ \n' +
        ' /____/     welcome to the system\n\n'
    );
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
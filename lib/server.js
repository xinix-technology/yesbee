var net = require('net'),
    Q = require('q'),
    logger = require('./logger'),
    _ = require('lodash');

var Server = function(container) {
    var that = this;

    this.container = container;
    this.port = container.props.port;
    this.host = container.props.host;

    this.s = net.createServer(function(c) {
        c.setEncoding('utf-8');

        c.write(that.motd());
        c.write('> ');

        c.on('data', function(data) {
            data = data.trim();

            var segments = data.split(/\s+/);

            switch(segments[0]) {
                case '':
                    break;
                case 'help':
                    c.write('Available commands:\n' +
                        'help\n' +
                        'shutdown\n' +
                        'quit\n'
                    );
                    break;
                case 'shutdown':
                    that.container.stop();
                    c.end('Good bye!\n');
                    return;
                case 'quit':
                    c.end('Good bye!\n');
                    return;
                case 'ls':
                    var services = that.container.findServices();
                    c.write('Services:\n');
                    _.each(services, function(service) {
                        var status = 'uninitialized';
                        if (service.context) {
                            switch(service.context.status) {
                                case 0:
                                    status = 'stopped';
                                    break;
                                case 1:
                                    status = 'running';
                                    break;

                            }
                        }
                        c.write(service.name + ' [' + status + ']\n');
                    });
                    break;
                case 'start':
                    try {
                        that.container.startService(segments[1]);
                    } catch(e) {
                        c.write(e.message + '\n');
                    }
                    break;
                case 'stop':
                    try {
                        that.container.stopService(segments[1]);
                    } catch(e) {
                        c.write(e.message + '\n');
                    }
                    break;
                default:
                    c.write('Command not found, type "help" to see available commands!\n');

            }

            c.write('> ');

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
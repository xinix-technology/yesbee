var Q = require('q'),
    url = require('url'),
    logger = require('../logger'),
    http = require('http'),
    Exchange = require('../exchange'),
    _ = require('lodash'),
    channel = require('../channel'),
    Channel = channel.Channel;

var $http = {
    servers: {},

    get: function(uri) {
        var parsed = url.parse(uri);

        var s = this.servers[parsed.host];
        if (!s) {
            s = this.servers[parsed.host] = new Server(this, uri);
            s.listen();
        }

        return s;
    },

    attach: function(uri, component) {
        var parsed = url.parse(uri);
        this.get(uri).route(parsed.pathname, component);
    },

    detach: function(uri, component) {
        var parsed = url.parse(uri);
        this.get(uri).deroute(parsed.pathname, component);
    }

};

var Server = function(context, uri) {
    var that = this;

    var parsed = url.parse(uri);

    this.context = context;
    this.routes = {};

    this.protocol = parsed.protocol || 'http';
    this.hostname = parsed.hostname;
    this.port = parsed.port;
    this.sockets = [];
    this.id = this.protocol + '://' + this.hostname + ':' + this.port;

    this.callbackChannel = this.context.getChannelId(Channel.OUT, this);
    this.scopes = {};

    if (!this.port) {
        this.port = (this.protocol == 'http') ? 80 : 443;
    }

    this.server = http.createServer(function() {
        that.process.apply(that, arguments);
    });
};

Server.prototype = {
    normalizePath: function(pathname) {
        pathname = pathname.trim();

        if (pathname === '/') {
            return pathname;
        }

        return pathname.replace(/\/+$/, '');
    },

    route: function(pathname, handler) {
        pathname = this.normalizePath(pathname);
        this.routes[pathname] = handler;
        logger.i(this.context.id, 'add route ' + pathname + ' on ' + this.hostname + ':' + this.port);
    },

    deroute: function(pathname, handler) {
        pathname = this.normalizePath(pathname);
        var existingHandler = this.routes[pathname];

        if (existingHandler === handler) {
            delete this.routes[pathname];
        }
        logger.i(this.context.id, 'delete route ' + pathname + ' on ' + this.hostname + ':' + this.port);
    },

    listen: function() {
        console.log('XXXXXX', 'pppp');
        var deferred = Q.defer(),
            that = this;

        this.server.listen(this.port, this.hostname, function() {
            logger.i(that.context.id, 'server listening on ' + that.hostname + ':' + that.port);
            deferred.resolve();
        });

        var sockets = this.sockets = [];

        this.context.on(this.callbackChannel, function(exchange) {
            Q(that.callback(exchange))
                .fail(function(e) {
                    logger.e(e.message + "\n" + e.stack);
                });
        });

        this.server.on('connection', function (socket) {
            sockets.push(socket);
            socket.on('close', function () {
                sockets.splice(sockets.indexOf(socket), 1);
            });
        });

        return deferred.promise;
    },

    process: function(req, res) {

        console.log('XXXXXX', 'pppp');

        var parsed = url.parse(req.url);
        var pathname = this.normalizePath(parsed.pathname);
        var handler = this.routes[pathname],
            handlerIndex = pathname;

        if (!handler) {
            handlerIndex = null;
            handler = _.find(this.routes, function(route, i) {
                if (pathname.substr(0, i.length) === i) {
                    handlerIndex = i;
                    return i;
                }
            });
        }

        if (!handler) {
            res.writeHead(404);
            res.end(pathname + ' NOT FOUND\n');
        } else {

            var exchange = new Exchange();

            exchange.header('yesbee-http-server', this.hostname + ':' + this.port);
            exchange.header('yesbee-http-handler', handlerIndex);
            exchange.header('yesbee-http-version', req.httpVersion);
            exchange.header('yesbee-request-method', req.method);
            exchange.header('yesbee-request-url', req.url);
            exchange.header('yesbee-query-string', parsed.query);
            exchange.header('yesbee-translated-path', pathname);
            exchange.header('yesbee-translated-uri', pathname.substr(handlerIndex.length === 1 ? 0 : handlerIndex.length));

            for (var key in req.headers) {
                exchange.header('http-'+key, req.headers[key]);
            }

            exchange.body = req;
            exchange.property('callback', this.callbackChannel);
            this.addScope(exchange, req, res);
            this.context.send(Channel.IN, handler, exchange, this);

        }
    },

    addScope: function(exchange, req, res) {
        this.scopes[exchange.id] = {
            request: req,
            response: res,
            exchange: exchange
        };
    },

    callback: function(exchange) {
        var scope = this.scopes[exchange.id];

        if (exchange.error) {
            if (exchange.error.statusCode) {
                scope.response.writeHead(exchange.error.statusCode);
            } else {
                scope.response.writeHead(500);
            }
            scope.response.end(JSON.stringify({error:exchange.error.message}));
        } else {
            if (exchange.body.pipe) {
                exchange.body.pipe(scope.response);
            } else {
                scope.response.write(exchange.body);
                scope.response.end();
            }
        }
    },

    close: function(force) {
        var deferred = Q.defer(),
            that = this;
        try {
            this.server.close(function() {
                deferred.resolve();
                that.sockets = [];
            });

            if (force) {
                _.each(this.sockets, function(socket) {
                    socket.destroy();
                });
                that.sockets = [];
            }
        } catch(e) {
            deferred.reject(e);
        }

        return deferred.promise;
    }
};

$http.Server = Server;

module.exports = $http;
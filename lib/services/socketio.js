var url = require('url'),
    logger = require('../logger'),
    Exchange = require('../exchange'),
    Channel = require('../channel'),
    socketio = require('socket.io');

var $socketio = {
    // dependencies: [
    //     'http',
    // ],
    handlers: {},
    servers: {},
    sockets: {},
    socketId: null,
    normalizePath: function(pathname) {
        pathname = pathname.trim();
        if (pathname === '/') {
            return pathname;
        }
        return pathname.replace(/\/+$/, '');
    },

    get: function(uri) {

        var that = this,
            parsed = url.parse(uri),
            pathname = parsed.pathname,
            ioWrapper = this.servers[pathname];

        if (!this.servers[pathname]) {
            ioWrapper = new IOWrapper(this, uri);
            this.servers[pathname] = ioWrapper;
        }

        return ioWrapper;
    },

    attach: function(uri, component) {
        var parsed = url.parse(uri);
        this.get(uri).addHandler(parsed.pathname || '/', component.options.eventName, component);
    },

    // detach: function(uri, component) {
    //     var parsed = url.parse(uri);
    //     this.get(uri).removeHandler(parsed.pathname || '/', component.options.eventName, component);
    // },

    getSocketById: function(id) {

        return this.sockets[id];
    },

    removeHandler: function(pathname, eventName, handler) {
        pathname = this.normalizePath(pathname);
        var existingHandler = this.servers[pathname];
        if (existingHandler === handler) {
            delete this.servers[pathname];
        }
        logger.i(this.context.id, 'delete handler ' + pathname + ' on ' + this.hostname + ':' + this.port);
    }

};

var IOWrapper = function(context, uri) {
    var that = this;

    var parsed = url.parse(uri);

    this.handlers = {};
    this.context = context;
    this.sockets = {};

    var httpService = this.context.getService('http'),
        httpWrapper = httpService.get(uri);

    this.io = socketio(httpWrapper.server);

    this.io.on('connection', function (socket) {

        logger.i('SOCKETIO:: connection established');
        logger.i('SOCKETIO::', socket.id);
        that.context.sockets[socket.id] = socket;
        socket.on('disconnect', function() {
            console.log('SOCKETIO:: disconnected');
        });

    });
};

IOWrapper.prototype = {

    addHandler: function(pathname, eventName, handler) {

        this.handlers[pathname] = handler;
        var that = this;

        console.log(that.sockets[that.socketId]);

        this.io.on('connection', function (socket) {
            socket.on(eventName, function(data) {
                console.log('SOCKETIO:: -----------------');
                console.log('SOCKETIO::', data);
                var exchange = new Exchange();
                exchange.body = data;
                exchange.headers['socketio-session-id'] = socket.id;
                that.context.send(Channel.IN, handler, exchange, that);
            });
        });

    }

};

// Server.prototype = {
//     normalizePath: function(pathname) {
//         pathname = pathname.trim();

//         if (pathname === '/') {
//             return pathname;
//         }

//         return pathname.replace(/\/+$/, '');
//     },

//     route: function(pathname, handler) {
//         pathname = this.normalizePath(pathname);
//         this.routes[pathname] = handler;
//         logger.i(this.context.id, 'add route ' + pathname + ' on ' + this.hostname + ':' + this.port);
//     },

//     routeWS: function(namespace, eventName, handler) {
//         // FIXME right now namespace ignored, please implement namespacing later!

//         this.wsRoutes[eventName] = handler;
//         logger.i(this.context.id, 'add ws route event "' + eventName + '" on ' + this.hostname + ':' + this.port);

//         var that = this;

//         this.io.on('connection', function (socket) {

//             socket.on(eventName, function(data) {

//                 var exchange = new Exchange();
//                 exchange.body = data;
//                 // console.log('WS:: session id', socket.id);
//                 exchange.headers['socketio-session-id'] = socket.id;

//                 that.context.send(Channel.IN, handler, exchange, that);

//             });

//         });


//     },

//     getSocketById: function(id) {
//         return this.io.sockets.connected[id];
//     },

//     deroute: function(pathname, handler) {
//         pathname = this.normalizePath(pathname);
//         var existingHandler = this.routes[pathname];

//         if (existingHandler === handler) {
//             delete this.routes[pathname];
//         }
//         logger.i(this.context.id, 'delete route ' + pathname + ' on ' + this.hostname + ':' + this.port);
//     },

//     listen: function() {
//         var deferred = Q.defer(),
//             that = this;

//         this.server.listen(this.port, this.hostname, function() {
//             logger.i(that.context.id, 'server listening on ' + that.hostname + ':' + that.port);
//             deferred.resolve();
//         });

//         var sockets = this.sockets = [];

//         this.context.on(this.callbackChannel, function(exchange) {
//             Q(that.callback(exchange))
//                 .fail(function(e) {
//                     logger.e(e.message + "\n" + e.stack);
//                 });
//         });

//         this.server.on('connection', function (socket) {
//             sockets.push(socket);
//             socket.on('close', function () {
//                 sockets.splice(sockets.indexOf(socket), 1);
//             });
//         });

//         return deferred.promise;
//     },

//     process: function(req, res) {

//         var parsed = url.parse(req.url);
//         var pathname = this.normalizePath(parsed.pathname);
//         var handler = this.routes[pathname],
//             handlerIndex = pathname;

//         if (!handler) {
//             handlerIndex = null;
//             handler = _.find(this.routes, function(route, i) {
//                 if (pathname.substr(0, i.length) === i) {
//                     handlerIndex = i;
//                     return i;
//                 }
//             });
//         }

//         if (!handler) {
//             res.writeHead(404);
//             res.end(pathname + ' NOT FOUND\n');
//         } else {

//             var exchange = new Exchange();

//             exchange.header('yesbee-http-server', this.hostname + ':' + this.port);
//             exchange.header('yesbee-http-handler', handlerIndex);
//             exchange.header('yesbee-http-version', req.httpVersion);
//             exchange.header('yesbee-request-method', req.method);
//             exchange.header('yesbee-request-url', req.url);
//             exchange.header('yesbee-query-string', parsed.query);
//             exchange.header('yesbee-translated-path', pathname);
//             exchange.header('yesbee-translated-uri', pathname.substr(handlerIndex.length === 1 ? 0 : handlerIndex.length));

//             for (var key in req.headers) {
//                 exchange.header('http-'+key, req.headers[key]);
//             }

//             exchange.body = req;
//             exchange.property('callback', this.callbackChannel);
//             this.addScope(exchange, req, res);
//             this.context.send(Channel.IN, handler, exchange, this);

//         }
//     },

//     addScope: function(exchange, req, res) {
//         this.scopes[exchange.id] = {
//             request: req,
//             response: res,
//             exchange: exchange
//         };
//     },

//     callback: function(exchange) {
//         var scope = this.scopes[exchange.id];

//         if (exchange.error) {
//             if (exchange.error.statusCode) {
//                 scope.response.writeHead(exchange.error.statusCode);
//             } else {
//                 scope.response.writeHead(500);
//             }
//             scope.response.end(JSON.stringify({error:exchange.error.message}));
//         } else {
//             if (exchange.body.pipe) {
//                 exchange.body.pipe(scope.response);
//             } else {
//                 scope.response.write(exchange.body);
//                 scope.response.end();
//             }
//         }
//     },

//     close: function(force) {
//         var deferred = Q.defer(),
//             that = this;
//         try {
//             this.server.close(function() {
//                 deferred.resolve();
//                 that.sockets = [];
//             });

//             if (force) {
//                 _.each(this.sockets, function(socket) {
//                     socket.destroy();
//                 });
//                 that.sockets = [];
//             }
//         } catch(e) {
//             deferred.reject(e);
//         }

//         return deferred.promise;
//     }
// };

// $socketio.Server = Server;

module.exports = $socketio;
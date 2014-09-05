var fs = require('fs'),
    Context = require('./context'),
    path = require('path'),
    logger = require('./logger'),
    _ = require('lodash'),
    Registry = require('./registry'),
    Server = require('./server');

var Container = function(container) {
    var that = this;

    container = container || path.resolve('./container');

    this.props = {
        container: container,
        port: 9999,
        host: '127.0.0.1',
        autostart: [],
    };

    var manifestFile = path.join(container, 'manifest.json');
    if (fs.existsSync(manifestFile)) {
        var manifest = fs.readFileSync(manifestFile, 'utf8');
        _.extend(this.props, JSON.parse(manifest));
    }

    this.server = new Server(this);
};

Container.prototype = {
    populateScripts: function(dir) {
        if (!fs.existsSync(dir)) {
            return {};
        }

        var ls = fs.readdirSync(dir),
            result = {};

        ls.forEach(function(f) {
            var ext = path.extname(f),
                name;
            if (ext == '.js') {
                name = path.basename(f, ext);
                result[name] = path.resolve(dir, name);
            } else {
                name = path.basename(f, ext);
                result[name] = path.resolve(dir, name);
            }
        });

        return result;
    },

    populateServices: function() {

        var that = this,
            result = _.defaults(
                this.populateScripts(path.join(this.props.container, 'services')),
                this.populateScripts(path.join(__dirname, 'services'))
            );

        _.each(result, function(v, k) {
            var service = that.getRegistry().get('services::' + k) || {};

            _.extend(service, {
                name: k,
                path:v
            });

            that.getRegistry().put('services::' + k, service);
        });

    },

    getRegistry: function() {
        if (!this.registry) {
            this.registry = Registry.create();
        }

        return this.registry;
    },

    startService: function(name) {
        this.getService(name).context.start();
    },

    stopService: function(name) {
        this.getService(name).context.stop();
    },

    getService: function(name) {
        this.populateServices();
        var service = this.getRegistry().get('services::' + name);

        if (service) {
            if (!service.context) {
                service.context = Context.create(require(service.path), this);
            }
        } else {
            throw new Error('Service "' + name + '" not available.');
        }

        return service;

    },

    findServices: function() {
        this.populateServices();
        return this.getRegistry().find('services::*');
    },

    startServer: function() {
        var that = this;
        this.server.listen().then(function(s) {
            logger.i('Server bound to ' + s.address().address + ':' + s.address().port);
        });
    },

    start: function() {
        console.log('\n############## YesBee ##############\n');
        var that = this;
            // prompt = require('./util/prompt')

        this.populateServices();

        // autostart
        _.each(this.props.autostart, function(s) {
            try {
                that.startService(s);
            } catch(e) {
                logger.e('Cannot autostart service "' + s + '"\n' + e.stack);
            }
        });


        // run server
        this.startServer();

        // FIXME should refactor out prompt to service
        // prompt.on('help', 'Help', function() {
        //     logger.p('Available commands:');
        //     for(var i in prompt.handlers) {
        //         var handle = prompt.handlers[i];
        //         logger.p(handle.name + ' ' + handle.description);
        //     }
        // });

        // prompt.on('quit', function() {
        //     prompt.close();
        // });

        // prompt.on('ls', function() {
        //     that.populateServices();

        //     logger.p('Services:');
        //     for(var i in that.services) {
        //         var status = 'uninitialized';
        //         if (that.services[i].context) {
        //             switch(that.services[i].context.status) {
        //                 case 0:
        //                     status = 'stopped';
        //                     break;
        //                 case 1:
        //                     status = 'running';
        //                     break;

        //             }
        //         }
        //         logger.p(i, '[' + status + ']');
        //     }
        // });

        // prompt.on('start', function(name) {
        //     var service = that.services[name];
        //     if (service) {
        //         if (!service.context) {

        //             var context = Context.create(require(service.path));

        //             service.context = context;
        //         }
        //         service.context.start();
        //     } else {
        //         logger.e('Cannot start "' + name + '" or service not available.');
        //     }
        // });

        // prompt.on('stop', function(name) {
        //     var service = that.services[name];
        //     if (service) {
        //         if (service.context) {
        //             service.context.stop();
        //         }
        //     } else {
        //         logger.e('Cannot stop "' + name + '" or service not available.');
        //     }
        // });

        // prompt.on('prop', function(key, value) {
        //     // logger.p(arguments.length, arguments);
        //     if (arguments.length === 0) {
        //         for(var i in that.props) {
        //             logger.p(i + ' = ' + that.props[i]);
        //         }
        //     } else if (arguments.length == 1) {
        //         logger.p(that.props[key]);
        //     } else {
        //         that.props[key] = value;
        //     }
        // });
    },

    stop: function() {
        this.server.close();
    }

};


var m = module.exports = new Container();
m.Container = Container;
m.Context = Context;
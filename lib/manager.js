var fs = require('fs'),
    Context = require('./context'),
    path = require('path'),
    logger = require('./logger'),
    _ = require('lodash');

var Manager = function() {
    this.props = {
        container: path.resolve('./container')
    };
    this.services = {};
};

Manager.prototype = {
    populateScripts: function(dir) {
        if (!fs.existsSync(dir)) {
            return {};
        }

        var ls = fs.readdirSync(dir),
            result = {};
        ls.forEach(function(f) {
            var ext = path.extname(f);
            if (ext == '.js') {
                var name = path.basename(f, ext);
                result[name] = path.resolve(dir, name);
            } else {
                logger.e('Cannot populate non javascript file yet!');
            }
        });

        return result;
    },

    populateServices: function() {

        var result = _.defaults(
            this.populateScripts(path.join(this.props.container, 'services')),
            this.populateScripts(path.join(__dirname, 'services'))
        );

        for(var i in result) {
            if (!this.services[i]) {
                this.services[i] = {
                    path: result[i]
                };
            }
        }

        return this.services;
    },

    start: function() {
        var prompt = require('./util/prompt'),
            that = this;

        this.populateServices();

        prompt.on('help', 'Help', function() {
            logger.p('Available commands:');
            for(var i in prompt.handlers) {
                var handle = prompt.handlers[i];
                logger.p(handle.name + ' ' + handle.description);
            }
        });

        prompt.on('quit', function() {
            prompt.close();
        });

        prompt.on('prop', function(key, value) {
            // logger.p(arguments.length, arguments);
            if (arguments.length === 0) {
                for(var i in that.props) {
                    logger.p(i + ' = ' + that.props[i]);
                }
            } else if (arguments.length == 1) {
                logger.p(that.props[key]);
            } else {
                that.props[key] = value;
            }
        });

        prompt.on('ls', function() {
            that.populateServices();

            logger.p('Services:');
            for(var i in that.services) {
                var status = 'uninitialized';
                if (that.services[i].context) {
                    switch(that.services[i].context.status) {
                        case 0:
                            status = 'stopped';
                            break;
                        case 1:
                            status = 'running';
                            break;

                    }
                }
                logger.p(i, '[' + status + ']');
            }
        });

        prompt.on('start', function(name) {
            var service = that.services[name];
            if (service) {
                if (!service.context) {
                    var context = new Context();

                    var x = require(service.path);
                    if (typeof x == 'function') {
                        context.initialize = x;
                    } else {
                        throw new Error('Unimplemented start object-type context plugin');
                    }

                    if (context.initialize) {
                        context.initialize();
                    }

                    service.context = context;
                }
                service.context.start();
            } else {
                logger.e('Cannot start "' + name + '" or service not available.');
            }
        });

        prompt.on('stop', function(name) {
            var service = that.services[name];
            if (service) {
                if (service.context) {
                    service.context.stop();
                }
            } else {
                logger.e('Cannot stop "' + name + '" or service not available.');
            }
        });
    }

};

module.exports = new Manager();

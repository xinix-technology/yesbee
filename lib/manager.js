var fs = require('fs'),
    path = require('path'),
    logger = require('./logger');

var Manager = function() {
    this.props = {
        container: path.resolve('./container')
    };

    this.installed = {};
};

Manager.prototype = {
    start: function() {
        var prompt = require('./util/prompt'),
            that = this;

        var ls = fs.readdirSync(path.join(this.props.container, 'installed'));
        ls.forEach(function(f) {
            var ext = path.extname(f);
            if (ext == '.js') {
                var name = path.basename(f, ext);
                this.installed[name] = {
                    path: path.resolve(this.props.container, 'installed', name),
                    running: false
                };
            } else {
                logger.e('Cannot populate non javascript file yet!');
            }
        });

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
            logger.p('Installed:');
            for(var i in that.installed) {
                logger.p(i, that.installed[i].running);
            }
        });

        prompt.on('run', function(name) {
            var component = that.installed[name];
            if (component) {
                var fn = require(component.path);
                fn();
                component.running = true;
            } else {
                logger.e('Cannot run "' + name + '" or component not available.');
            }
        });

        prompt.on('stop', function(name) {
            var component = that.installed[name];
            if (component) {
                component.running = false;
            } else {
                logger.e('Cannot stop "' + name + '" or component not available.');
            }
        })
    }

};

module.exports = new Manager();

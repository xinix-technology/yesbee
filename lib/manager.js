var fs = require('fs'),
    path = require('path');

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
                console.warn('Cannot populate non javascript file yet!');
            }
        });

        prompt.on('help', 'Help', function() {
            console.log('Available commands:');
            for(var i in prompt.handlers) {
                var handle = prompt.handlers[i];
                console.log(handle.name + ' ' + handle.description);
            }
        });

        prompt.on('quit', function() {
            prompt.close();
        });

        prompt.on('prop', function(key, value) {
            // console.log(arguments.length, arguments);
            if (arguments.length == 0) {
                for(var i in that.props) {
                    console.log(i + ' = ' + that.props[i]);
                }
            } else if (arguments.length == 1) {
                console.log(that.props[key]);
            } else {
                that.props[key] = value;
            }
        });

        prompt.on('ls', function() {
            console.log('Installed:');
            for(var i in that.installed) {
                console.log(i, that.installed[i].running);
            }
        });

        prompt.on('run', function(name) {
            var component = that.installed[name];
            if (component) {
                var fn = require(component.path);
                fn();
                component.running = true;
            } else {
                console.warn('Cannot run "' + name + '" or component not available.');
            }
        });

        prompt.on('stop', function(name) {
            var component = that.installed[name];
            if (component) {
                component.running = false;
            } else {
                console.warn('Cannot stop "' + name + '" or component not available.');
            }
        })
    }

};

module.exports = new Manager();

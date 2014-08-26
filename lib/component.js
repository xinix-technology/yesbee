var url = require('url'),
    fs = require('fs'),
    path = require('path');

var Component = function(uri) {
    this.uri = uri;
};

Component.registries = {};

Component.register = function(name, clazz) {
    this.registries[name + ':'] = clazz;
};

Component.create = function(uri) {
    var parsed = url.parse(uri || ''),
        plugin, component;
    if (!parsed || !parsed.protocol) {
        throw new Error('Unparsed URI "' + uri + '" or no protocol.');
    }

    plugin = this.registries[parsed.protocol];

    if (!plugin) {
        throw new Error('Plugin protocol "' + parsed.protocol + '" not registered!');
    }

    component =  new Component(uri);
    Object.getOwnPropertyNames(plugin).forEach(function(name) {
        component[name] = plugin[name];
    });

    return component;
};

// init
var internals = fs.readdirSync(path.join(__dirname, 'components'));
internals.forEach(function(f) {
    var ext = path.extname(f);
    if (ext == '.js') {
        var name = path.basename(f, ext);
        Component.register(name, require('./components/' + name));
    } else {
        console.warn('Cannot populate non javascript file yet!');
    }
});


module.exports = Component;
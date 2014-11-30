/**
 * yesbee container
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
var fs = require('fs'),
    Context = require('./context'),
    Component = require('./component'),
    Exchange = require('./exchange'),
    channel = require('./channel'),
    Channel = channel.Channel,
    path = require('path'),
    logger = require('./logger'),
    registry = require('./registry'),
    Server = require('./server'),
    clc =  require('cli-color'),
    Table = require('easy-table'),
    cluster = require('cluster'),
    uuid = require('node-uuid'),
    Q = require('q');

/**
 * Container
 * @param {string} containerPath
 */
var Container = function(manifest) {
    var manifestFile,
        moduleDir = path.resolve('./node_modules');

    // init scope map
    this.scopes = {};

    // default props
    this.props = {
        name: 'yesbee',
        workerid: '0',
        container: path.resolve('.'),
        host: '127.0.0.1',
        port: 9999,
        autostart: []
    };

    this.prop(manifest);

    logger.id = this.props.workerid = cluster.worker.id;

    logger.i('Starting container', this.props);

    // populate scopes
    this.addScope(__dirname);
    if (fs.existsSync(moduleDir)) {
        fs.readdirSync(moduleDir).forEach(function(f) {
            if (f.indexOf('yesbee-') === 0) {
                this.addScope(path.resolve(moduleDir, f));
            }
        }.bind(this));
    }

    // add prop/container as scope
    this.addScope(this.prop('container'));

    // initialize yesbee server
    this.server = new Server(this);
};

Container.prototype.Container = Container;
Container.prototype.Context = Context;
Container.prototype.Exchange = Exchange;
Container.prototype.Channel = Channel;
Container.prototype.channel = channel;
Container.prototype.logger = logger;

/**
 * Container#addScope
 * @param {string} rootDir Root directory for the new scope
 *
 * @return {Container} to be chained
 */
Container.prototype.addScope = function(rootDir) {
    rootDir = rootDir.trim();
    this.scopes[rootDir] = rootDir;
    return this;
};

Container.prototype.getScopes = function() {
    return Object.keys(this.scopes);
};

/**
 * Getter/setter for prop
 * @param  {var} arg1
 * @param  {var} arg2
 * @return {var}
 */
Container.prototype.prop = function(propName, propValue) {
    if (propName === null) {
        this.props = {};
    } else if (typeof propName === 'object') {
        for(var i in propName) {
            this.prop(i, propName[i]);
        }
    } else {
        if (arguments.length === 1) {
            return this.props[propName];
        } else {
            this.props[propName] = propValue;
        }
    }
};

Container.prototype.populate = function(type) {
    var dir = type + 's',
        scripts = [];

    this.getScopes().forEach(function(scope) {
        var scopeDir = path.resolve(scope, dir);

        if (!fs.existsSync(scopeDir)) {
            return;
        }

        fs.readdirSync(scopeDir).forEach(function(file) {
            var ext = path.extname(file),
                name = path.basename(file, ext);
            if (ext === '.js' || ext === '.node') {
                scripts[name] = path.resolve(scopeDir, name);
            }
        });
    });

    return scripts;
};

Container.prototype.get = function(key) {
    return registry.get(key);
};

Container.prototype.put = function(key, value) {
    return registry.put(key, value);
};

Container.prototype.find = function(selector) {
    return registry.find(selector);
};

var messages = {};

Container.prototype.send = function(method) {
    var messageId = uuid.v1();

    var defer = Q.defer();

    messages[messageId] = {
        defer: defer,
        time: new Date()
    };

    process.send({
        id: messageId,
        method: method,
        arguments: Array.prototype.slice.call(arguments, 1)
    });

    return defer.promise;
};

Container.prototype.reply = function(reply) {
    var result = {};
    reply.reply.forEach(function(rep) {
        result[rep.destination] = rep.result;
    });
    messages[reply.id].defer.resolve(result);
};

Container.prototype.remoteStartService = function(serviceName) {
    try {
        this.get('services::' + serviceName).start();
    } catch(e) {

    }
};

Container.prototype.remoteStopService = function(serviceName) {
    try {
        this.get('services::' + serviceName).stop();
    } catch(e) {

    }
};

Container.prototype.remoteGetAllServices = function() {
    var services = [];
    registry.find('services::*').forEach(function(service) {
        services.push({
            name: service.name,
            status: service.status
        });
    });

    return services;
};

Container.prototype.populateComponents = function() {
    var components = this.populate('component');
    for(var key in components) {
        Component.register(key, require(components[key]), this);
    }
};

Container.prototype.populateServices = function() {
    var services = this.populate('service');
    for(var key in services) {
        var service = Context.create(key, require(services[key]), this);
        this.put('services::' + key, service);
    }
};

Container.prototype.getService = function(name) {
    return registry.get('services::' + name);
};

Container.prototype.start = function() {
    var that = this;

    this.populateComponents();
    this.populateServices();

    // autostart
    this.prop('autostart').forEach(function(s) {
        try {
            this.getService(s).start();
        } catch(e) {
            logger.e('Cannot autostart service "' + s + '"\n' + e.stack);
        }
    }.bind(this));

    // run server
    this.server.listen().then(function(s) {
        logger.i('Server bound to ' + s.address().address + ':' + s.address().port);
    });
};

Container.prototype.stop = function() {
    this.server.close();
};

Container.prototype.require = function(name) {
    return require(name);
};

var container = module.exports = function(manifest) {
    return new Container(manifest);
};
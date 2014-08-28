var url = require('url'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    path = require('path'),
    logger = require('./logger'),
    qs = require('querystring'),
    _ = require('lodash'),
    Q = require('q');

var Component = function(route, uri, options) {
    this.id = Component.generateId();
    this.route = route;
    this.status = 0;
    this.next = null;
};

Component.registries = {};

Component.generateId = function() {
    return 'component/' + uuid.v1();
};


Component.register = function(name, clazz) {
    this.registries[name + ':'] = clazz;
};

Component.create = function(route, o, options) {
    var component;
    if (o instanceof Component) {
        o.route = this;
        return o;
    } else if (typeof o === 'function') {
        component = new Component(route);
        component.process = o;
        return component;
    }

    uri = o.trim();

    var parsed = url.parse(uri || ''),
        plugin;

    if (!parsed || !parsed.protocol) {
        throw new Error('Unparsed URI "' + uri + '" or no protocol.');
    }

    plugin = this.registries[parsed.protocol];

    if (!plugin) {
        throw new Error('Plugin protocol "' + parsed.protocol + '" not registered!');
    }

    component =  new Component(route);
    _.extend(component, plugin);
    component.beforeInit(uri, options);
    if (component.initialize) {
        component.initialize();
    }

    return component;
};

Component.prototype.beforeInit = function(uri, options) {
    uri = uri.trim();

    var type = uri.split(':')[0] || '',
        parsed = url.parse(uri);

    var strOptions = qs.parse(parsed.query);
    var search = parsed.search || '';

    uri = uri.substr(0, uri.length - search.length);

    this.type = type + '$component';
    this.componentType = type;

    this.uri = uri;

    this.options = _.extend({ exchangePattern: 'inOnly' }, this.options, strOptions || {}, options || {});

    var that = this;
    this.route.context.on(this.uri + '::in', function(exchange) {
        Q(that.doProcess(exchange))
            .fail(function(e) {
                logger.e(e.message +
                    "\n----------------------\n" +
                    e.stack +
                    "\n----------------------");
            });
    });

    this.route.context.on(this.uri + '::out', function(exchange) {
        that.doCallback(exchange);
    });
};

Component.prototype.start = function() {
    // logger.i(this.id, 'starting...');
    this.status = 1;
};

Component.prototype.stop = function() {
    // logger.i(this.id, 'stopping...');
    this.status = 0;
};

Component.prototype.doProcess = function(exchange) {
    logger.i(this.uri, exchange);

    var that = this,
        promise = Q(this.process(exchange));

    return promise.then(function(exchange) {
        that.send(exchange);
    });
};

Component.prototype.process = function(exchange) {
    return exchange;
};

Component.prototype.send = function(exchange) {
    var context = this.route.context;
    if (this.next) {
        context.emit(this.next.uri + '::in', exchange);
    }
};

// init
var internals = fs.readdirSync(path.join(__dirname, 'components'));
internals.forEach(function(f) {
    var ext = path.extname(f);
    if (ext == '.js') {
        var name = path.basename(f, ext);
        Component.register(name, require('./components/' + name));
    } else {
        logger.e('Cannot populate non javascript file yet!');
    }
});


module.exports = Component;
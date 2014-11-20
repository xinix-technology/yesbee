var Route = require('./route'),
    uuid = require('node-uuid'),
    ProducerTemplate = require('./producer-template'),
    Component = require('./component'),
    Registry = require('./registry'),
    Channel = require('./channel'),
    _ = require('lodash'),
    url = require('url'),
    qs = require('querystring'),
    logger = require('./logger');

/**
 * Context is base class for two different type of services
 * - route context service
 * - application service
 */
var Context = function(container) {
    this.clazz = '$context';
    this.id = Context.generateId();
    this.status = 0;
    this.routes = {};
    this.trace = false;
    this.producerTemplates = [];

    this.sourceRegistries = {};

    this.container = container;
};

/**
 * Static method to generate id for new instance of context
 * @return string unique id of context
 */
Context.ID = 0;

Context.generateId = function() {
    // use simple id instead of uuid
    return 'context-' + Context.ID++;
    // return 'context/' + uuid.v1();
};

Context.prototype.from = function(uri) {
    var route = new Route(this);
    this.routes[route.id] = route;
    route.from(uri);

    return route;
};

Context.prototype.start = function() {
    _.each(this.routes, function(route) {
        route.start();
    });

    _.each(this.producerTemplates, function(template) {
        template.start();
    });

    this.status = 1;
};

Context.prototype.stop = function() {
    _.each(this.routes, function(route) {
        route.stop();
    });

    _.each(this.producerTemplates, function(template) {
        template.stop();
    });

    this.status = 0;
};

Context.prototype.createProducerTemplate = function() {
    var template = new ProducerTemplate(this);

    if (this.status === 1) {
        template.start();
    }

    this.producerTemplates.push(template);

    return template;
};

Context.prototype.createComponent = function(o, options) {
    var uri, component, fn;
    if (typeof o == 'function') {
        component = new Component('processor:', options);
        component.process = o;
    } else {
        component = new Component(o, options);
    }

    component.context = this;

    return component;
};

Context.prototype.createSourceComponent = function(o, options) {
    var component = this.createComponent(o, options);
    component.type = 'source';

    if (this.sourceRegistries[component.uri]) {
        throw new Error('Component with uri: ' + component.uri + ' already found at registry');
    }

    this.sourceRegistries[component.uri] = component;

    return component;
};

// no test /////////////////////////////////////////////////////////////////////
Context.create = function(plugin, container) {
    var context = new Context(container);

    if (typeof plugin == 'function') {
        context.initialize = plugin;
    } else {
        _.extend(context, plugin);
    }

    context.initialize();

    return context;
};

Context.prototype.initialize = function() {

};

Context.prototype.lookup = function(o) {
    return this.sourceRegistries[o];
};

Context.prototype.getChannel = function() {
    this.channel = this.channel || Channel.create();
    return this.channel;
};

Context.prototype.on = function() {
    var channel = this.getChannel();
    channel.on.apply(channel, arguments);
};

Context.prototype.send = function(channelType, to, exchange, from) {

    var channelId = this.getChannelId(channelType, to);

    console.log('Context:: channelType', channelType);
    console.log('Context:: channelId', channelId);

    if (this.trace) {
        var origin = (from instanceof Component) ? from.route.id : from.id;
        console.log('<--------------------------------------------------------');
        logger.i(origin, {
            trace: channelType + ' ' + to + ' <<< ' + from,
            channel: channelId,
            exchange: exchange + ''
        });
        console.log('---------------------------------------------------------');
    }

    // if (exchange.TEST == 1) {
    //     console.log('xxx', Channel.OUT, to + '', exchange + '');
    //     return;
    // }
    this.getChannel().emit(channelId, exchange);
};

Context.prototype.removeListener = function() {
    var channel = this.getChannel();
    channel.removeListener.apply(channel, arguments);
};

Context.prototype.getChannelId = function(type, component) {
    if (type === Channel.SINK) {
        return '::' + type;
    }

    if (typeof component === 'string') {
        component = this.lookup(o);
    }

    if (!component) {
        throw new Error('Channel not found for "undefined" component');
    }

    var contextId = component.context.id || this.id;

    return contextId + '::' + component.id + '::' + type;
};

Context.prototype.getRegistry = function() {
    if (!this.registry) {
        this.registry = Registry.create();
    }

    return this.registry;
};

Context.prototype.getService = function(name) {
    var service = this.getRegistry().get('services::' + name);
    if (service) {
        return service.context;
    }
};
// no test /////////////////////////////////////////////////////////////////////

module.exports = Context;

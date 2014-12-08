/**
 * yesbee context
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
var Route = require('./route'),
    uuid = require('node-uuid'),
    ProducerTemplate = require('./producer-template'),
    Component = require('./component'),
    registry = require('./registry'),
    channel = require('./channel'),
    Channel = channel.Channel,
    _ = require('lodash'),
    url = require('url'),
    qs = require('querystring'),
    logger = require('./logger'),
    clc = require('cli-color');

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
Context.create = function(name, plugin, container) {
    try {
        var context = new Context(container);
        context.name = name;

        if (typeof plugin == 'function') {
            context.initialize = plugin;
        } else {
            _.extend(context, plugin);
        }

        context.initialize(container);

        return context;
    } catch(e) {
        logger.e('Cannot create context for service "' + name + '"', e);
        throw e;
    }
};

Context.prototype.initialize = function() {

};

Context.prototype.lookup = function(o) {
    return this.sourceRegistries[o];
};

Context.prototype.getChannel = function() {
    return channel;
};

Context.prototype.on = function() {
    channel.on.apply(channel, arguments);
};

Context.prototype.send = function(channelType, to, exchange, from) {
    var channelId = this.getChannelId(channelType, to);

    if (this.trace) {
        var origin = (from instanceof Component) ? from.route.id : from.id;
        logger.rt(origin, {
            type: channelType,
            to: to + '',
            from: from + '',
            channel: channelId
        }, exchange);
    }

    channel.emit(channelId, exchange);
};

Context.prototype.removeListener = function() {
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

Context.prototype.getService = function(name) {
    return registry.get('services::' + name);
};
// no test /////////////////////////////////////////////////////////////////////

module.exports = Context;

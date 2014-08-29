var Route = require('./route'),
    uuid = require('node-uuid'),
    util = require('util'),
    ProducerTemplate = require('./producer-template'),
    EventEmitter = require('events').EventEmitter,
    _ = require('lodash');

/**
 * Context is base class for two different type of services
 * - route context service
 * - application service
 */
var Context = function() {
    this.type = '$context';
    this.id = Context.generateId();
    this.status = 0;
    this.routes = {};
    this.trace = false;
    this.defaultComponent = null;
    this.producerTemplates = [];
};

util.inherits(Context, EventEmitter);

/**
 * Static method to generate id for new instance of context
 * @return string unique id of context
 */
Context.generateId = function() {
    return 'context/' + uuid.v1();
};

Context.prototype.from = function(uri) {
    var route = new Route(this);
    this.routes[route.id] = route;
    route.from(uri);

    if (!this.defaultComponent) {
        this.defaultComponent = route.inputs[0];
    }

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

module.exports = Context;

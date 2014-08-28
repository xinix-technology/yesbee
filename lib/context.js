var Route = require('./route'),
    uuid = require('node-uuid'),
    util = require('util'),
    ProducerTemplate = require('./producer-template'),
    EventEmitter = require('events').EventEmitter;

var Component = require('./component');

var Context = function() {
    this.type = '$context';
    this.id = Context.generateId();
    this.status = 0;
    this.routes = {};
    this.trace = false;
    this.defaultComponent = null;
};

util.inherits(Context, EventEmitter);

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
    for(var i in this.routes) {
        var route = this.routes[i];
        route.start();
    }
    this.status = 1;
};

Context.prototype.stop = function() {
    for(var i in this.routes) {
        var route = this.routes[i];
        route.stop();
    }
    this.status = 0;
};

Context.prototype.createProducerTemplate = function() {
    return new ProducerTemplate(this);
};

module.exports = Context;

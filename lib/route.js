var uuid = require('node-uuid'),
    _ = require('lodash');

var Route = function(context) {
    this.clazz = '$route';
    this.id = Route.generateId();

    this.context = context;
    this.source = null;
    this.processors = [];
};

Route.ID = 0;

Route.generateId = function() {
    // use simple id instead of uuid
    return 'route-' + Route.ID++;
    // return 'route/' + uuid.v1();
};

Route.prototype.from = function(o, options) {
    var component = this.context.createSourceComponent(o, options);
    component.route = this;

    this.source = component;

    return this;
};

Route.prototype.to = function(o, options) {
    var component = this.context.createComponent(o, options);
    component.route = this;

    this.processors.push(component);

    return this;
};

Route.prototype.choice = function() {
    var component = this.context.createComponent('choice:' + uuid.v1());
    component.route = this;

    this.processors.push(component);

    return component;
};

Route.prototype.multicast = function() {
    var component = this.context.createComponent('multicast:' + uuid.v1());
    component.route = this;

    this.processors.push(component);

    return component;
};

Route.prototype.start = function() {
    if (!this.context) {
        throw new Error('Context is missing');
    }

    var processors = this.processors;

    this.source.next = processors[0];

    processors.forEach(function(component, i) {
        var next = processors[i + 1] || null;
        component.next = next;
    });

    this.source.start();

    this.processors.forEach(function(component) {
        component.start();
    });
};

Route.prototype.stop = function() {
    this.source.stop();

    this.processors.forEach(function(component) {
        component.stop();
    });
};

// no test /////////////////////////////////////////////////////////////////////
Route.prototype.query = function(name) {
    if (name === this.source.uri) {
        return this.source;
    }
    return _.find(this.processors, function(component) {
        return (component.uri == name);
    });
};

Route.prototype.queryAll = function(name) {
    if (name === this.source.uri) {
        return [this.source];
    }
    return _.filter(this.processors, function(component) {
        return (component.uri == name);
    });
};
// no test /////////////////////////////////////////////////////////////////////

module.exports = Route;
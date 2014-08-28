var uuid = require('node-uuid'),
    Component = require('../lib/component');

var Route = function(context) {
    this.type = '$route';
    this.id = Route.generateId();

    this.context = context;
    this.inputs = [];
    this.outputs = [];
};

Route.generateId = function() {
    return 'route/' + uuid.v1();
};

Route.prototype.from = function(o, options) {
    var component = this.resolve(o, options);

    this.inputs.push(component);

    return this;
};

Route.prototype.to = function(o, options) {
    var component = this.resolve(o, options);

    this.outputs.push(component);

    return this;
};

Route.prototype.resolve = function(o, options) {
    var component = Component.create(this, o, options);
    return component;
};

Route.prototype.start = function() {
    var outputs = this.outputs;

    this.inputs.forEach(function(component) {
        component.next = outputs[0];
    });

    outputs.forEach(function(component, i) {
        var next = outputs[i + 1] || null;
        component.next = next;
    });

    this.inputs.forEach(function(component) {
        component.start();
    });
};

Route.prototype.stop = function() {
    this.inputs.forEach(function(component) {
        component.stop();
    });
};


module.exports = Route;
/**
 * yesbee route
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
    var component = this.context.createComponent('choice:');
    component.route = this;

    this.processors.push(component);

    return component;
};

Route.prototype.multicast = function(strategy) {
    var component = this.context.createComponent('multicast:' + uuid.v1());
    component.setStrategy(strategy);
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
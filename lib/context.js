var Component = require('./component.js');

var Context = function() {
    this.routes = [];
};

Context.prototype.from = function(uri) {
    return Component.create(uri);
};

module.exports = Context;
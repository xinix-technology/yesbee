'use strict';

var Component = {};

Component.Impl = require('./impl')(Component);
Component.Registry = require('./registry')(Component);

module.exports = Component;
'use strict';

var Service = {
  STOPPED: 0,
  STARTED: 1,

  sequence: 0,
};

Service.Registry = require('./registry')(Service);
Service.Impl = require('./impl')(Service);

module.exports = Service;
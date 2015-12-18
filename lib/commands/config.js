// jshint esnext: true
const sprintf = require('sprintf-js').sprintf;
const _ = require('lodash');

module.exports = (function() {
  'use strict';
  function serviceCommand(execution) {
    console.log('Configuration'.blue);
    _.forEach(execution.config, function(value, index) {
      console.log(sprintf('%\'.-20s'.yellow + ' %s', index, value));
    });
  }
  return serviceCommand;
})();
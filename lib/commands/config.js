// jshint esnext: true
const sprintf = require('sprintf-js').sprintf;
const _ = require('lodash');

module.exports = (function() {
  'use strict';
  function configCommand(execution) {
    console.log('Client Configuration'.blue);
    _.forEach(execution.config, function(value, index) {
      console.log(sprintf('%\'.-20s'.yellow + ' %s', index, value));
    });
  }
  return configCommand;
})();
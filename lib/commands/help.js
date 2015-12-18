//jshint esnext:true
const sprintf = require('sprintf-js').sprintf;

module.exports = (function() {
  'use strict';

  return function(execution) {
    console.log('yesbee 2'.green);
    console.log('');
    console.log('Usage'.blue);
    console.log('  yesbee [<opts...>] <command> [<args...>]');
    console.log('');
    console.log('Commands'.blue);
    console.log('  daemon   start daemon');
    console.log('  help     this help');
  };
})();
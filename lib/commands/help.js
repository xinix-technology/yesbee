//jshint esnext:true
const sprintf = require('sprintf-js').sprintf;

module.exports = (function() {
  'use strict';

  return function(execution) {
    console.log('yesbee '.green + require('../../package.json').version.red);
    console.log('');
    console.log('Usage'.blue);
    console.log('  yesbee <command> [<opts...>] [<args...>]');
    console.log('');
    console.log('Commands'.blue);
    console.log('  daemon   start daemon');
    console.log('  help     this help');
  };
})();
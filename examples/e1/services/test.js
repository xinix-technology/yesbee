//jshint esnext:true
const co = require('co');

module.exports = (function() {
  'use strict';

  return function() {
    var x = this.from('direct:foo')
      .to('log:foo')
      .to('log:bar')
      .to('log:baz');

    this.on('start', function() {
      co(function *() {
        try {
          // console.log('started');
          var result = yield this.request('direct:foo', {me: 'moo'});
          console.log('result', result);
        } catch(e) {
          console.error(e.stack);
        }
      }.bind(this));
    });
  };
})();

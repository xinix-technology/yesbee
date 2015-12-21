//jshint esnext:true
module.exports = (function() {
  'use strict';
  return {
    *process (message) {
        yield this.request(message);
    }
  };
})();
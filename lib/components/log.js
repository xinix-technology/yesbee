// jshint esnext:true
module.exports = (function() {
  'use strict';
  return {
    createSource(uri) {
      throw new Error('Component: log cannot act as source');
    },

    process(message) {
      this.logger({message: JSON.stringify(message), $name: message.uri});
    }
  };
})();
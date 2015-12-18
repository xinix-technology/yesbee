// jshint esnext:true
const Source = require('../source');

module.exports = (function() {
  'use strict';

  return {
    process(message) {
      this.get(message.uri).data.messages.push(message);
    },

    get(uri) {
      if (!this.sources[uri]) {
        var source = this.sources[uri] = new Source(this, uri);
        source.data = {
          messages: [],
        };
      }
      return this.sources[uri];
    }
  };
})();
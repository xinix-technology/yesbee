//jshint esnext:true
module.exports = (function() {
  'use strict';
  return {
    *process (message) {
        yield this.request(message);
    }
    // start(source) {
    //   // var component = this;

    //   // Object.defineProperty(this, 't', { enumerable: false, writable: true, configurable: true, value: null});

    //   // function fn () {
    //   //   source.consume(component.createMessage(new Date()));
    //   //   component.t = setTimeout(fn, 2000);
    //   // }
    //   // component.t = setTimeout(fn, 2000);
    // },

    // stop() {
    //   // clearTimeout(this.t);
    // }
  };
})();
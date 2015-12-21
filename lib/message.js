//jshint esnext:true
const uuid = require('node-uuid');
module.exports = (function() {
  'use strict';

  function Message (body) {
    Object.defineProperties(this, {
      id: { enumerable:false, writable:true, configurable: false, value: uuid.v1() },
      uri: { enumerable:true, writable:true, configurable: false, value: null },
      body: { enumerable:false, writable:true, configurable: false, value: body },
      headers: { enumerable: false, writable: true, configurable: false, value: {} },
    });
  }
  return Message;
})();
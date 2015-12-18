//jshint esnext:true
const uuid = require('node-uuid');
module.exports = (function() {
  'use strict';

  function Message (body) {
    Object.defineProperties(this, {
      uri: { enumerable:true, writable:true, configurable: false, value: null },
      id: { enumerable:true, writable:true, configurable: false, value: uuid.v1() },
      body: { enumerable:true, writable:true, configurable: false, value: body },
    });
  }
  return Message;
})();
'use strict';

module.exports = function(component) {
  component.process = function *(message) {
      yield component.request(message);
  };
};
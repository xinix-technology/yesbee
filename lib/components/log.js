'use strict';

module.exports = function(component) {
  component.createSource = function (uri) {
    throw new Error('Component: log cannot act as source');
  };

  component.process = function (message) {
    component.logger({message: JSON.stringify(message), $name: message.uri});
  };
};
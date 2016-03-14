'use strict';

module.exports = function(component) {
  component.process = function (message) {
    component.get(message.uri).data.messages.push(message);
  };

  component.get = function (uri) {
    if (!component.sources[uri]) {
      component.sources[uri] = component.createSource(uri);
      component.sources[uri].data = {
        messages: [],
      };
    }
    return component.sources[uri];
  };
};
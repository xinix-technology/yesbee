//jshint esnext:true
const assert = require('assert');
const directComponent = require('../../lib/components/direct');
const logComponent = require('../../lib/components/log');
const App = require('../../lib/app');
const Route = require('../../lib/route');
const sinon = require('sinon');

require('co-mocha');

describe('log component', function() {
  'use strict';

  var app;
  beforeEach(function() {
    app = new App()
      .addComponent('direct', directComponent)
      .addComponent('log', logComponent);
  });

  function route() {
    return new Route(app);
  }

  it ('act as source', function () {
    assert.throws(function() {
      route().from('log:foo');
    }, Error);
  });

  it ('act as processor', function *() {
    var rfoo = route().from('direct:foo')
      .to('log:bar')
      .to('log:baz')
      .start();

    app.logger = sinon.spy();
    var result = yield app.client.request('direct:foo', []);
    sinon.assert.calledTwice(app.logger);
    sinon.assert.calledWith(app.logger, sinon.match.has('message'));
  });
});
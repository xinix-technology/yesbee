//jshint esnext:true
const assert = require('assert');
const directComponent = require('../../lib/components/direct');
const App = require('../../lib/app');
const Route = require('../../lib/route');
const sinon = require('sinon');

require('co-mocha');

describe('direct component', function() {
  'use strict';

  var app;
  beforeEach(function() {
    app = new App();
    app.addComponent('direct', directComponent);
  });

  function route() {
    return new Route(app);
  }

  it ('act as source', function *() {
    var r = route().from('direct:foo')
      .to(function() {
        this.body = 'Hello ' + this.body.name;
      })
      .start();

    var result = yield app.client.request('direct:foo', {name: 'foo'});
    assert.equal(result.body, 'Hello foo');
  });

  it ('act as processor', function *() {
    var rfoo = route().from('direct:foo')
      .to(function() {
        this.body.push('foo1');
        assert.equal(this.uri, 'direct:foo', 'Before uri is not foo');
      })
      .to('direct:bar')
      .to(function() {
        this.body.push('foo2');
        assert.equal(this.uri, 'direct:foo', 'After uri is not foo');
      })
      .start();

    var rbar = route().from('direct:bar')
      .to(function() {
        this.body.push('bar1');
        assert.equal(this.uri, 'direct:bar', 'Inside uri is not bar');
      })
      .start();

    var result = yield app.client.request('direct:foo', []);
    assert.deepEqual(result.body, ['foo1', 'bar1', 'foo2']);
  });
});
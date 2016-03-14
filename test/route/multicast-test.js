//jshint esnext:true
const assert = require('assert');
const sinon = require('sinon');
const Suite = require('../suite');

require('co-mocha');

describe('Route#multicast', function() {
  'use strict';

  var suite;
  beforeEach(function() {
    suite = new Suite()
      .addComponents('mock', 'direct');
  });

  it('send to all of processor asynchronously', function *() {
    yield suite.test(function(service) {
      service.from('mock:start')
        .multicast()
          .to('mock:foo')
          .to('mock:bar')
          .to('mock:baz')
        .end();
    });

    var result = yield suite.request('mock:start', 'hello');

    assert.equal(suite.get('mock:foo').data.messages.length, 1, 'Message not arrived yet');
    assert.equal(suite.get('mock:bar').data.messages.length, 1, 'Message not arrived yet');
    assert.equal(suite.get('mock:baz').data.messages.length, 1, 'Message not arrived yet');
  });
});
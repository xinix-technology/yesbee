//jshint esnext:true
const assert = require('assert');
const sinon = require('sinon');
const Suite = require('../suite');

require('co-mocha');

describe('Route#choice', function() {
  'use strict';

  var suite;
  beforeEach(function() {
    suite = new Suite()
      .addComponents('mock', 'direct');
  });

  it('choose by predicate', function *() {
    yield suite.test(function() {
      this.from('mock:start')
        .choice()
          .when((message) => message.body === 'foo').to('mock:foo')
          .when((message) => message.body === 'bar').to('mock:bar')
          .otherwise().to('mock:baz')
        .end();
    });

    var result;
    result = yield suite.request('mock:start', 'foo');
    result = yield suite.request('mock:start', 'bar');
    result = yield suite.request('mock:start', 'foobar');

    assert.equal(suite.get('mock:foo').data.messages.length, 1, 'Message not arrived yet');
    assert.equal(suite.get('mock:bar').data.messages.length, 1, 'Message not arrived yet');
    assert.equal(suite.get('mock:baz').data.messages.length, 1, 'Message not arrived yet');
  });
});
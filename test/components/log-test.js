//jshint esnext:true
const assert = require('assert');
const sinon = require('sinon');
const Suite = require('../suite');

require('co-mocha');

describe('log component', function() {
  'use strict';

  var suite;
  beforeEach(function() {
    suite = new Suite()
      .addComponents('direct', 'log');
  });

  it ('act as source', function() {
    assert.throws(function() {
      suite.test(function() {
        this.from('log:foo');
      });
    }, /cannot act as source/i);
  });

  it ('act as processor', function *() {
    yield suite.test(function() {
        this.from('direct:foo')
          .to('log:bar')
          .to('log:baz');
      })
      .request('direct:foo', []);

    sinon.assert.calledTwice(suite.logger);
    sinon.assert.calledWith(suite.logger, sinon.match.has('message'));
  });
});
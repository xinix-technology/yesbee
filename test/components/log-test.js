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

  it ('throw error when act as source', function *() {
    try {
      yield suite.test(function(service) {
        service.from('log:foo');
      });
      throw new Error('Unexpected reach this line, expected error previous lines');
    } catch(e) {
      assert(e.message.match(/cannot act as source/i));
    }
  });

  it ('act as processor', function *() {
    yield suite.test(function(service) {
        service.from('direct:foo')
          .to('log:bar')
          .to('log:baz');
      });

    yield suite.request('direct:foo', []);

    sinon.assert.calledWith(suite.logger, sinon.match.has('$name', 'log:bar'));
    sinon.assert.calledWith(suite.logger, sinon.match.has('$name', 'log:baz'));
    sinon.assert.calledWith(suite.logger, sinon.match.has('message'));
  });
});
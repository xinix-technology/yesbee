//jshint esnext:true
const assert = require('assert');
const sinon = require('sinon');
const Suite = require('../suite');

require('co-mocha');

describe('mock component', function() {
  'use strict';

  var suite;
  beforeEach(function() {
    suite = new Suite()
      .addComponents('mock', 'mock');
  });

  it ('act as processor', function () {
    suite.test(function() {
      this.from('mock:start')
        .to('mock:foo');
    })
    .send('mock:start', 1)
    .send('mock:start', 2)
    .send('mock:start', 3);

    assert.equal(suite.get('mock:foo').data.messages.length, 3);
  });
});
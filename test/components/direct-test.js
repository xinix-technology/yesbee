//jshint esnext:true
const assert = require('assert');
const sinon = require('sinon');
const Suite = require('../suite');

require('co-mocha');

describe('direct component', function() {
  'use strict';

  var suite;
  beforeEach(function() {
    suite = new Suite()
      .addComponents('direct');
  });

  it ('act as source', function *() {
    yield suite.test(function() {
      this.from('direct:foo')
        .to(function() {
          this.body = 'Hello ' + this.body.name;
        });
    });

    var result = yield suite.request('direct:foo', {name: 'foo'});
    assert.equal(result.body, 'Hello foo');
  });

  it ('act as processor', function *() {
    yield suite.test(function() {
        this.from('direct:foo')
          .to(function() {
            this.body.push('foo1');
            assert.equal(this.uri, 'direct:foo', 'Before uri is not foo');
          })
          .to('direct:bar')
          .to(function() {
            this.body.push('foo2');
            assert.equal(this.uri, 'direct:foo', 'After uri is not foo');
          });

        this.from('direct:bar')
          .to(function() {
            this.body.push('bar1');
            assert.equal(this.uri, 'direct:bar', 'Inside uri is not bar');
          });
      });

    var result = yield suite.request('direct:foo', []);

    assert.deepEqual(result.body, ['foo1', 'bar1', 'foo2']);
  });
});
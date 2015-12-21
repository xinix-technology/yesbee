//jshint esnext:true
const assert = require('assert');
const sinon = require('sinon');
const Suite = require('../suite');
const streamUtil = require('../../lib/utils/stream');

require('co-mocha');

describe('pipe component', function() {
  'use strict';

  var suite;
  beforeEach(function() {
    suite = new Suite()
      .addComponents('mock', 'pipe');
  });

  it('throw error when act as source', function *() {
    try {
      yield suite.test(function() {
        this.from('pipe:foo')
          .to('mock:bar');
      });
      throw new Error('Unexpected reach this line, expected error previous lines');
    } catch(e) {
      assert(e.message.match(/cannot act as source/i));
    }
  });

  describe('act as processor', function() {
    it ('read cmd from uri', function *() {
      yield suite.test(function() {
          this.from('mock:foo')
            .to('pipe:wc -c');
        });

      var result = yield {
        foo: suite.request('mock:foo', 'hello fooz'),
        bar: suite.request('mock:foo', 'hello bar'),
      };

      assert.equal(result.foo.body.toString().trim(), '10');
      assert.equal(result.bar.body.toString().trim(), '9');
    });

    it ('has cmd from options', function *() {
      yield suite.test(function() {
          this.from('mock:foo')
            .to('pipe:wc', {
              cmd: ['wc', '-w']
            });
        });

      var result = yield suite.request('mock:foo', 'hello world');
      assert.equal(result.body.toString().trim(), '2');
    });

    it ('stream result', function *() {
      yield suite.test(function() {
          this.from('mock:foo')
            .to('pipe:wc', {
              cmd: ['wc', '-c'],
              streaming: true
            });
        });

      var result = yield suite.request('mock:foo', 'hello world');
      var body = yield streamUtil.drain(result.body);
      assert.equal(body.toString().trim(), '11');
    });

    it ('persistent cmd', function *() {
      yield suite.test(function() {
          this.from('mock:foo')
            .to('pipe:bar', {
              cmd: ['node', './test/components/mocks/persistent.js'],
              persistent: true
            });
        });

      var result = [];
      for(var i = 0; i < 10; i++) {
        result.push(suite.request('mock:foo', 'foo-' + i));
      }

      result = yield result;
      for(i in result) {
        assert.equal(result[i].body.toString(), 'hello foo-' + i);
      }
    });
  });
});
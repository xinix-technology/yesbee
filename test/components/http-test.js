//jshint esnext:true
const assert = require('assert');
const sinon = require('sinon');
const Suite = require('../suite');
const request = require('superagent');

require('co-mocha');

describe('mock component', function() {
  'use strict';

  describe('act as source', function() {
    var suite;
    beforeEach(function() {
      suite = new Suite()
        .addComponents('mock', 'http');
    });

    afterEach(function *() {
      yield suite.end();
    });

    it ('listen to specified port', function *() {
      yield suite.test(function() {
        this.from('http://0.0.0.0:8080')
          .to('mock:result');
      });

      var response = yield request('http://localhost:8080')
          .timeout(500);

      if (suite.get('mock:result').data.messages.length !== 1) {
        throw new Error('Message not arrived yet');
      }
    });

    it ('attach same daemon to different uris', function *() {
      yield suite.test(function() {
        this.from('http://0.0.0.0:8080/bar')
          .to(function() {
            this.body = this.body.url;
          })
          .to('mock:bar');

        this.from('http://0.0.0.0:8080')
          .to(function() {
            this.body = this.body.url;
          })
          .to('mock:foo');
      });

      yield request('http://localhost:8080')
          .timeout(500);

      yield request('http://localhost:8080/bar')
          .timeout(500);

      if (suite.get('mock:foo').data.messages.length !== 1) {
        throw new Error('Message not arrived yet');
      }

      if (suite.get('mock:bar').data.messages.length !== 1) {
        throw new Error('Message not arrived yet');
      }
    });
  });

  describe('act as processor', function() {
    var suite;
    beforeEach(function *() {
      suite = new Suite()
        .addComponents('mock', 'http');

      yield suite.test(function() {
        this.from('http://0.0.0.0:8080')
          .to(function() {
            this.body = { uri: this.headers['http-request-uri'] };
          });

        this.from('mock:foo')
          .to('http://localhost:8080/foo');
      });
    });

    afterEach(function *() {
      yield suite.end();
    });

    it ('return json on json endpoint', function *() {
      var result = yield suite.request('mock:foo');
      assert.equal(result.body.uri, '/foo');
    });
  });
});
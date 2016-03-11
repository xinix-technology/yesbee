// jshint esnext: true
const assert = require('assert');
const sinon = require('sinon');
const Client = require('../lib/client');

describe('Client', function() {
  'use strict';

  describe('#request', function() {
    it ('delegate invocation to component#request', function() {
      var requestMock = sinon.stub().returns(Promise.resolve());
      var client = new Client({
        components: {
          get: sinon.stub().returns({
            request: requestMock,
          })
        }
      });

      var result = client.request('foo:bar', {});
      assert.equal(result.constructor.name, 'Promise');
      sinon.assert.calledOnce(requestMock);
    });
  });

  describe('#send', function() {
    it ('delegate invocation to component#send', function() {
      var sendMock = sinon.stub();
      var client = new Client({
        components: {
          get: sinon.stub().returns({
            send: sendMock,
          })
        }
      });

      var result = client.send('foo:bar', {});
      assert(result === undefined);
      sinon.assert.calledOnce(sendMock);
    });
  });
});
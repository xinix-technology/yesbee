// jshint esnext: true
const sinon = require('sinon');
const assert = require('assert');
const Source = require('../lib/source');

describe('Source', function () {
  describe('#consume', function() {
    it('require first arg as message', function() {
      var messageMock = {};
      var source = new Source({}, 'foo:bar');
      source.consumer = sinon.stub();
      assert.throws(function() {
        source.consume();
      }, /invalid argument/i);

      source.consume(messageMock);
    });

    it('return promise', function() {
      var messageMock = {};
      var source = new Source({}, 'foo:bar');
      source.consumer = sinon.stub();
      var result = source.consume(messageMock);
      assert.equal(result.constructor.name, 'Promise');
    });

    it('log error in-between consumer calls', function(done) {
      var source = new Source({}, 'foo:bar');
      source.logger = sinon.spy();
      source.consumer = function *() {
        yield 'x';
        throw new Error('Expected error!');
      };

      try {
        source.consume({})
          .then(function() {
            done(new Error('No expected error'));
          }, function(e) {
            sinon.assert.calledOnce(source.logger);
            done();
          });
      } catch(e) {
        console.error(e);
      }
    });
  });

  describe('#start', function() {
    it('invoke Component#start', function() {
      var componentMock = {
        start: sinon.spy(),
        stop: sinon.spy(),
      };
      var source = new Source(componentMock, 'foo:bar');
      source.start();
      sinon.assert.calledOnce(componentMock.start);
      sinon.assert.notCalled(componentMock.stop);
    });
  });

  describe('#stop', function() {
    it('invoke Component#stop', function() {
      var componentMock = {
        start: sinon.spy(),
        stop: sinon.spy(),
      };
      var source = new Source(componentMock, 'foo:bar');
      source.stop();
      sinon.assert.calledOnce(componentMock.stop);
      sinon.assert.notCalled(componentMock.start);
    });
  });
});
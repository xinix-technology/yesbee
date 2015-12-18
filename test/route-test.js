// jshint esnext: true
const assert = require('assert');
const sinon = require('sinon');
const Route = require('../lib/route');

describe('Route', function() {
  describe('#from', function() {
    it('create new source for the route', function() {
      var sourceMock = {};
      var componentMock = {
        createSource() {
          return sourceMock;
        }
      };
      var route = new Route({
        getComponentByUri() {
          return componentMock;
        }
      });
      var result = route.from('foo:bar');
      assert.equal(route.sources.length, 1);
      assert.equal(route.sources[0], sourceMock);
    });

    it('return self to be chained', function() {
      var sourceMock = {};
      var componentMock = {
        createSource() {
          return sourceMock;
        }
      };
      var route = new Route({
        getComponentByUri() {
          return componentMock;
        }
      });
      var result = route.from('foo:bar');
      assert.equal(result, route);
    });
  });

  describe('#to', function() {
    it('create new processor for the route', function() {
      var processorMock = {};
      var componentMock = {
        createProcessor() {
          return processorMock;
        }
      };
      var route = new Route({
        getComponentByUri() {
          return componentMock;
        }
      });
      var result = route.to('foo:bar');
      assert.equal(route.processors.length, 1);
      assert.equal(route.processors[0], processorMock);

      route.to('foo:baz');
      assert.equal(route.processors.length, 2);
      assert.equal(route.processors[1], processorMock);
    });

    it('return self to be chained', function() {
      var processorMock = {};
      var componentMock = {
        createProcessor() {
          return processorMock;
        }
      };
      var route = new Route({
        getComponentByUri() {
          return componentMock;
        }
      });
      var result = route.to('foo:bar');
      assert.equal(result, route);
    });
  });

  describe('#process', function() {
    it ('return self to be chained', function() {
      var chainMock = function *(next) {
        yield 'x';
      };
      var route = new Route({});
      var result = route.process(chainMock);
      assert.equal(route, result);
    });

  });

  describe('#start', function() {
    it('start sources', function() {
      var sourcesMock = [
        {
          start: sinon.spy()
        },
        {
          start: sinon.spy()
        }
      ];
      var route = new Route({});
      route.sources = sourcesMock;
      route.start();
      sinon.assert.calledOnce(sourcesMock[0].start);
      sinon.assert.calledOnce(sourcesMock[1].start);
    });
  });

  describe('#stop', function() {
    it('stop sources', function() {
      var sourcesMock = [
        {
          stop: sinon.spy()
        },
        {
          stop: sinon.spy()
        }
      ];
      var route = new Route({});
      route.sources = sourcesMock;
      route.stop();
      sinon.assert.calledOnce(sourcesMock[0].stop);
      sinon.assert.calledOnce(sourcesMock[1].stop);
    });
  });
});
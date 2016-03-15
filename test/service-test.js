// jshint esnext: true
const sinon = require('sinon');
const assert = require('assert');
const Service = require('../lib/service');

require('co-mocha');

describe('Service', function () {
  'use strict';

  describe('#from', function() {
    it('invoke component#createSource', function() {
      var componentMock = {
        createSource: sinon.spy()
      };
      var contextMock = {
        logger() {},
        components: {
          get() {
            return componentMock;
          }
        }
      };
      var service = new Service.Impl(contextMock, 'foo');
      service.from('direct:foo');
      sinon.assert.calledOnce(componentMock.createSource);
    });
  });

  describe('#start', function() {
    var routeMock = {
      start: sinon.spy(),
      stop: sinon.spy(),
    };
    var events = {
      start: sinon.spy(),
      stop: sinon.spy(),
    };

    var service, result;
    before(function *() {
      service = new Service.Impl({
        logger() {}
      }, 'foo');
      service.routes.push(routeMock);
      service.on('start', events.start);
      service.on('stop', events.stop);
      result = yield service.start();
    });

    it ('return promise', function() {
      assert.equal(result, service, 'return value should be the service itself');
    });

    it('invoke start of routes in context', function() {
      sinon.assert.calledOnce(routeMock.start);
      sinon.assert.notCalled(routeMock.stop);
    });

    it('set status to 1', function() {
      assert.equal(new Service.Impl({}, 'foo').status, 0);
      assert.equal(service.status, 1);
    });

    it('emit start event', function() {
      sinon.assert.calledOnce(events.start);
      sinon.assert.notCalled(events.stop);
    });
  });

  describe('#stop', function() {
    var routeMock = {
      start: sinon.spy(),
      stop: sinon.spy()
    };
    var events = {
      start: sinon.spy(),
      stop: sinon.spy(),
    };
    var service = new Service.Impl({}, 'foo');
    service.status = 1;
    service.routes.push(routeMock);
    service.on('start', events.start);
    service.on('stop', events.stop);
    var result = service.stop();

    it('invoke stop of routes in context', function() {
      sinon.assert.calledOnce(routeMock.stop);
      sinon.assert.notCalled(routeMock.start);
    });

    it('set status to 0', function() {
      assert.equal(service.status, 0);
    });

    it('emit stop event', function() {
      sinon.assert.calledOnce(events.stop);
      sinon.assert.notCalled(events.start);
    });
  });

  describe('#client', function() {
    var service = new Service.Impl({}, 'foo');
    var client = service.client;
    assert.equal(client, service.context.client);
  });

  describe('Registry', function() {
    describe('#put', function() {
      var registry;
      beforeEach(function() {
        registry = new Service.Registry({});
      });

      it('return new service', function() {
        var result = registry.put('foo', sinon.spy());
        assert(result instanceof Service.Impl);
      });

      it('add new service', function() {
        var metaMock = sinon.spy();
        assert.equal(Object.keys(registry.values).length, 0);
        registry.put('foo', metaMock);
        assert(registry.values.foo);
        sinon.assert.calledOnce(metaMock);
      });
    });
  });

  // it('compile route', function () {
  //   var contextMock = {
  //     addRoute: sinon.spy()
  //   };
  //   var service = new Service.Impl(contextMock, 'foo');
  //   service.from('direct:foo')
  //     .to('direct:bar');
  //   // console.log(service);
  // });
});
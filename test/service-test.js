// jshint esnext: true
const sinon = require('sinon');
const assert = require('assert');
const Service = require('../lib/service');

describe('Service', function () {
  describe('#from', function() {
    it('invoke component#createSource', function() {
      var componentMock = {
        createSource: sinon.spy()
      };
      var appMock = {
        getComponentByUri: function(uri) {
          return componentMock;
        }
      };
      var service = new Service(appMock, 'foo');
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
    var service = new Service({}, 'foo');
    service.routes.push(routeMock);
    service.on('start', events.start);
    service.on('stop', events.stop);
    var result = service.start();

    it ('can be chained', function() {
      assert.equal(result, service, 'return value should be the service itself');
    });

    it('invoke start of routes in context', function() {
      sinon.assert.calledOnce(routeMock.start);
      sinon.assert.notCalled(routeMock.stop);
    });

    it('set status to 1', function() {
      assert.equal(new Service({}, 'foo').status, 0);
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
    var service = new Service({}, 'foo');
    service.status = 1;
    service.routes.push(routeMock);
    service.on('start', events.start);
    service.on('stop', events.stop);
    var result = service.stop();

    it ('can be chained', function() {
      assert.equal(result, service, 'return value should be the service itself');
    });

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
    var service = new Service({}, 'foo');
    var client = service.client;
    assert.equal(client, service.app.client);
  });

  // it('compile route', function () {
  //   var appMock = {
  //     addRoute: sinon.spy()
  //   };
  //   var service = new Service(appMock, 'foo');
  //   service.from('direct:foo')
  //     .to('direct:bar');
  //   // console.log(service);
  // });
});
// jshint esnext: true
const assert = require('assert');
const sinon = require('sinon');
const _ = require('lodash');
const servicesApi = require('../../lib/api/services');
const co = require('co');

describe('services api', function() {
  'use strict';

  var app, api;
  beforeEach(function() {
    app = {
      services: {
        foo: { name: 'foo', status: 0 },
        bar: { name: 'bar', status: 0 }
      }
    };
    api = servicesApi(app);
  });

  function action(name) {
    return function *(context) {
      return yield api.routes[name].handler.apply(context, arguments);
    };
  }

  describe('/', function() {
    it ('return all services', function(done) {
      co(function *() {
        var result = yield action('index')();
        assert.equal(_.keys(result).length, 2);
      }).then(done, done);
    });
  });

  describe('/{name}', function() {
    it ('return service by name', function(done) {
      co(function *() {
        var result = yield action('read')({
          attributes: {
            name: 'foo'
          }
        });
        assert.equal(result.name, 'foo');
      }).then(done, done);
    });

    it ('throw 404 if not found', function(done) {
      co(function *() {
        var throwMock = sinon.stub().throws();
        try {
          var result = yield action('read')({
            attributes: {
              name: 'baz'
            },
            throw: throwMock
          });
          throw new Error('Not supposed here');
        } catch(e) {
          throwMock.calledWith(404);
        }
      }).then(done, done);
    });
  });

  describe('/{name}/start', function() {
    it('invoke service#start()', function(done) {
      co(function *() {
        app.services.foo.start = sinon.spy();
        app.services.bar.start = sinon.spy();
        var result = yield action('start')({
          attributes: { name: 'foo' }
        });
        sinon.assert.calledOnce(app.services.foo.start);
        sinon.assert.notCalled(app.services.bar.start);
      }).then(done, done);
    });

    it ('throw 404 if not found', function(done) {
      co(function *() {
        var throwMock = sinon.stub().throws();
        try {
          var result = yield action('start')({
            attributes: {
              name: 'baz'
            },
            throw: throwMock
          });
          throw new Error('Not supposed here');
        } catch(e) {
          throwMock.calledWith(404);
        }
      }).then(done, done);
    });
  });

  describe('/{name}/stop', function() {
    it('invoke service#stop()', function(done) {
      co(function *() {
        app.services.foo.stop = sinon.spy();
        app.services.bar.stop = sinon.spy();
        var result = yield action('stop')({
          attributes: { name: 'foo' }
        });
        sinon.assert.calledOnce(app.services.foo.stop);
        sinon.assert.notCalled(app.services.bar.stop);
      }).then(done, done);
    });

    it ('throw 404 if not found', function(done) {
      co(function *() {
        var throwMock = sinon.stub().throws();
        try {
          var result = yield action('stop')({
            attributes: {
              name: 'baz'
            },
            throw: throwMock
          });
          throw new Error('Not supposed here');
        } catch(e) {
          throwMock.calledWith(404);
        }
      }).then(done, done);
    });
  });
});
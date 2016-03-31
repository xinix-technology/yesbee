// jshint esnext: true
const assert = require('assert');
const sinon = require('sinon');
const _ = require('lodash');
const Context = require('../../lib/context');
const servicesApi = require('../../lib/api/services');
const co = require('co');

describe('services api', function() {
  'use strict';

  var context, api;
  beforeEach(function() {
    context = new Context();
    context.services.values.foo = { name: 'foo', status: 0 };
    context.services.values.bar = { name: 'bar', status: 0 };
    api = servicesApi(context);
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
        context.services.values.foo.start = sinon.spy();
        context.services.values.bar.start = sinon.spy();
        var result = yield action('start')({
          attributes: { name: 'foo' }
        });
        sinon.assert.calledOnce(context.services.values.foo.start);
        sinon.assert.notCalled(context.services.values.bar.start);
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
        context.services.values.foo.stop = sinon.spy();
        context.services.values.bar.stop = sinon.spy();
        var result = yield action('stop')({
          attributes: { name: 'foo' }
        });
        sinon.assert.calledOnce(context.services.values.foo.stop);
        sinon.assert.notCalled(context.services.values.bar.stop);
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
// jshint esnext: true
const assert = require('assert');
const sinon = require('sinon');
const App = require('../lib/app');

describe('App', function() {
  'use strict';

  describe('constructor', function() {
    it('set argument object as config attribute', function() {
      var config = {
        foo: 'bar'
      };
      var app = new App(config);
      assert.equal(app.config, config);
    });
  });

  describe('#run', function() {
    it('invoke command function', function() {
      var app = new App();
      app.commands.foo = sinon.spy();
      app.run({
        id: 'foo'
      });

      sinon.assert.calledOnce(app.commands.foo);
    });

    it('return promise', function() {
      var logOriginal = console.log;
      console.log = function() {};
      var app = new App();
      var result = app.run({});
      console.log = logOriginal;
      assert.equal(result.constructor.name, 'Promise');
    });

    it('throw error on undefined command', function() {
      var app = new App();

      assert.throws(function() {
        app.run({
          id: 'foo'
        });
      }, /undefined command/i);
    });
  });

  describe('#logger', function() {
    it('invoke console#log on default level', function() {
      var originalFn = console.log;
      var spy = console.log = sinon.spy();

      var app = new App();
      app.logger({message: 'hello foo'});
      console.log = originalFn;

      sinon.assert.calledWithMatch(spy, sinon.match(/hello foo/));
    });

    it('invoke console#log on error level', function() {
      var originalFn = console.error;
      var spy = console.error = sinon.spy();

      var app = new App();
      app.logger({message: 'hello foo', level: 'error'});
      console.error = originalFn;

      sinon.assert.calledWithMatch(spy, sinon.match(/hello foo/));
    });
  });

  describe('#addComponent', function() {
    var app;
    beforeEach(function() {
      app = new App();
    });

    it('return self to chained', function() {
      var result = app.addComponent('foo');
      assert.equal(result, app);
    });

    it('add new component', function() {
      assert.equal(Object.keys(app.components).length, 0);
      app.addComponent('foo');
      assert(app.components.foo);
      app.addComponent('bar', {foo:'bar'});
      assert.equal(app.components.bar.foo, 'bar');
    });
  });

  describe('#addService', function() {
    var app;
    beforeEach(function() {
      app = new App();
    });

    it('return self to chained', function() {
      var result = app.addService('foo', sinon.spy());
      assert.equal(result, app);
    });

    it('add new service', function() {
      var metaMock = sinon.spy();
      assert.equal(Object.keys(app.services).length, 0);
      app.addService('foo', metaMock);
      assert(app.services.foo);
      sinon.assert.calledOnce(metaMock);
    });
  });

  describe('#getComponentByUri', function() {
    it('return component', function() {
      var app = new App();
      app.components.foo = {};
      var result = app.getComponentByUri('foo:xxx');
      assert.equal(result, app.components.foo);
    });

    it('throw error when no suitable component found', function() {
      var app = new App();
      assert.throws(function() {
        app.getComponentByUri('foo:xxx');
      }, /not found/i);
    });
  });

  describe('work as daemon', function() {
    it('define callback as http server callback', function(done) {
      var app = new App();
      app.logger = function() {};
      assert(app.callback === undefined);
      app.run({
          id: 'daemon'
        })
        .then(function() {
          assert(app.callback !== undefined);
        })
        .then(done, done);
    });
  });

  it.skip('work as client', function() {
    assert(false);
  });
});
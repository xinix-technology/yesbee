// jshint esnext: true
const assert = require('assert');
const sinon = require('sinon');
const Context = require('../lib/context');

describe('Context', function() {
  'use strict';

  describe('constructor', function() {
    it('set argument object as config attribute', function() {
      var config = {
        foo: 'bar'
      };
      var context = new Context(config);
      assert.equal(context.config, config);
    });
  });

  describe('#run', function() {
    it('invoke command function', function() {
      var context = new Context();
      context.commands.foo = sinon.spy();
      context.run({
        id: 'foo'
      });

      sinon.assert.calledOnce(context.commands.foo);
    });

    it('return promise', function() {
      var logOriginal = console.log;
      console.log = function() {};
      var context = new Context();
      var result = context.run({});
      console.log = logOriginal;
      assert.equal(result.constructor.name, 'Promise');
    });

    it('throw error on undefined command', function() {
      var context = new Context();

      assert.throws(function() {
        context.run({
          id: 'foo'
        });
      }, /undefined command/i);
    });
  });

  describe('#logger', function() {
    it('invoke console#log on default level', function() {
      var originalFn = console.log;
      var spy = console.log = sinon.spy();

      var context = new Context();
      context.logger({message: 'hello foo'});
      console.log = originalFn;

      sinon.assert.calledWithMatch(spy, sinon.match(/hello foo/));
    });

    it('invoke console#log on error level', function() {
      var originalFn = console.error;
      var spy = console.error = sinon.spy();

      var context = new Context();
      context.logger({message: 'hello foo', level: 'error'});
      console.error = originalFn;

      sinon.assert.calledWithMatch(spy, sinon.match(/hello foo/));
    });
  });

  describe('work as daemon', function() {
    it('define callback as http server callback', function(done) {
      var context = new Context();
      context.logger = function() {};
      assert(context.callback === undefined);
      context.run({
          id: 'daemon'
        })
        .then(function() {
          assert(context.callback !== undefined);
        })
        .then(done, done);
    });
  });

  it.skip('work as client', function() {
    assert(false);
  });
});
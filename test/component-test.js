// jshint esnext: true
const sinon = require('sinon');
const assert = require('assert');
const Component = require('../lib/component');

describe('Component', function () {
  'use strict';

  describe('#createSource', function() {
    it('throw unsatisfied uri pattern on wrong uri', function() {
      var appMock = {
      };
      var component = new Component(appMock, 'foo');

      assert.throws(function() {
        component.createSource('bar:baz');
      }, /unsatisfied uri pattern/i);
    });

    it('throw error on create source twice', function() {
      var appMock = {
      };
      var component = new Component(appMock, 'foo');
      component.createSource('foo:bar');
      assert.throws(function() {
        component.createSource('foo:bar');
      }, /already exists/i);
    });
  });

  describe('#createProcessor', function() {
    it('return generator function', function() {
      var component = new Component({}, 'foo');

      var result = component.createProcessor('foo:bar');
      assert.equal(result.constructor.name, 'GeneratorFunction');
    });
  });

  describe('#get', function() {
    it('return source', function() {
      var sourceMock = {};
      var component = new Component({}, 'foo');
      component.sources['foo:x'] = sourceMock;
      assert.equal(component.get('foo:x'), sourceMock);
    });
  });

  describe('#request', function() {
    it('throw error if not passing uri', function() {
      var component = new Component({}, 'foo');

      assert.throws(function() {
        component.request();
      }, /invalid argument/i);
    });

    it('throw error if no source', function() {
      var component = new Component({}, 'foo');

      assert.throws(function() {
        component.request('foo:bar');
      }, /no source/i);
    });

    it('return promise', function() {
      var sourceMock = {
        consume: sinon.spy(function *() {
          yield "x";
        })
      };

      var component = new Component({}, 'foo');
      component.sources['foo:bar'] = sourceMock;
      var result = component.request('foo:bar');
      assert.equal(result.constructor.name, 'Promise');

      sinon.assert.calledOnce(sourceMock.consume);
    });
  });

  describe('Registry', function() {
    var registry;
    beforeEach(function() {
      registry = new Component.Registry({});
    });

    describe('#get', function() {
      it('return component', function() {
        registry.values.foo = {};
        var result = registry.get('foo:bar');
        assert.equal(result, registry.values.foo);
      });

      it('throw error when no suitable component found', function() {
        assert.throws(function() {
          registry.get('foo:bar');
        }, /not found/i);
      });
    });
  });
});
// jshint esnext: true
const assert = require('assert');
const sinon = require('sinon');
const _ = require('lodash');
const componentsApi = require('../../lib/api/components');
const co = require('co');

describe('components api', function() {
  'use strict';

  var app, api;
  beforeEach(function() {
    app = {
      components: {
        foo: { name: 'foo' },
        bar: { name: 'bar' }
      }
    };
    api = componentsApi(app);
  });

  function action(name) {
    return function *(context) {
      return yield api.routes[name].handler.apply(context, arguments);
    };
  }

  describe('/', function() {
    it ('return all components', function(done) {
      co(function *() {
        var result = yield action('index')();
        assert.equal(_.keys(result).length, 2);
      }).then(done, done);
    });
  });

  describe('/{name}', function() {
    it ('return component by name', function(done) {
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
});
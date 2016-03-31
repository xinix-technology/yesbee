// jshint esnext: true
const assert = require('assert');
const path = require('path');
const co = require('co');
const config = require('../lib/config');

describe('config', function() {
  'use strict';

  it('has default values', function(done) {
    co(function *() {
      try {
        var c = yield config();
        assert.equal(path.resolve('./yesbee.sock'), path.resolve(c.socketPath));
        assert.equal('development', c.env);

        done();
      } catch(e) {
        done(e);
      }
    });
  });

  it('set host from YESBEE_HOST', function(done) {
    co(function *() {
      try {
        var c = yield config({
          YESBEE_HOST: 'http://localhost:3000'
        });
        assert.equal('http://localhost:3000', c.host);

        done();
      } catch(e) {
        done(e);
      }
    });
  });
});

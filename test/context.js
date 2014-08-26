var assert = require("assert")

var Context = require('../lib/context');

describe('Context', function(){
    describe('new', function(){
        it('should create context with empty routes', function() {
            var context = new Context();
            assert.equal(context.routes.length, 0);
        });
    });
});
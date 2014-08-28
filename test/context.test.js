var assert = require("assert"),
    expect = require('chai').expect;

var Context = require('../lib/context');

describe('Context', function(){
    var context;

    beforeEach(function(){
        context = new Context();
    });

    describe('new', function(){
        it('should create context with empty routes', function() {
            expect(context.routes).to.eql({});
        });
    });

    describe('#from()', function(){
        it('should create route', function() {
            var route = context.from('mock:test');
            expect(route).to.be.an('object');
        });
    });

    describe('.start()', function() {
        it('should start all input components', function() {
            context.from('mock:test')
                .to('mock:result');

            context.start();

            for(var i in context.routes) {
                var inputs = context.routes[i].inputs;
                for(var j in inputs) {
                    expect(inputs[j].status).to.equal(1);
                }
            }
        });
    });

    describe('.stop()', function() {
        it('should stop all input components', function() {
            context.from('mock:test')
                .to('mock:result');

            context.stop();

            for(var i in context.routes) {
                var inputs = context.routes[i].inputs;
                for(var j in inputs) {
                    expect(inputs[j].status).to.equal(0);
                }
            }
        });
    });
});
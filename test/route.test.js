var expect = require('chai').expect,
    Route = require('../lib/route'),
    Context = require('../lib/context'),
    Component = require('../lib/component');

var Route = require('../lib/route');

describe('Route', function(){
    var context;
    beforeEach(function() {
        context = new Context();
    });

    describe('new', function(){
        it('should create route', function() {
            var route = new Route();

            expect(route).to.be.an.instanceof(Route);
        });
    });

    describe('.from()', function(){
        it('should accept uri string', function() {
            var route = new Route(context);
            route.from('direct:in?x=a');

            expect(route.source).to.be.an.instanceof(Component);

        });

        it('should throw error if context is not specified', function() {
            expect(function() {
                var route = new Route();
                route.from('direct:test');
            }).to.throw(Error);
        });
    });

    describe('.to()', function(){
        it('should accept uri string', function() {
            var route = new Route(context);
            route.to('direct:result');

            expect(route.processors[0]).to.be.an.instanceof(Component);
        });

        it('should throw error if context is not specified', function() {
            expect(function() {
                var route = new Route();
                route.to('direct:test');
            }).to.throw(Error);
        });
    });

    describe('.start()', function(){
        it('should start inputs', function() {
            var route = new Route(context);
            route.from('direct:from')
                .to('direct:to');

            expect(route.source.status).to.be.equal(0);

            route.start();

            expect(route.source.status).to.be.equal(1);
        });

        it('should throw error if from not specified', function() {
            expect(function() {
                var route = new Route();
                route.from('direct:to');

                route.start();
            }).to.throw(Error);

        });
    });

    describe('.stop()', function(){
        it('should stop inputs', function() {
            var route = new Route(context);
            route.from('direct:from')
                .to('direct:to');

            route.start();

            expect(route.source.status).to.be.equal(1);

            route.stop();

            expect(route.source.status).to.be.equal(0);
        });
    });
});
var expect = require('chai').expect,
    Component = require('../lib/component');

var Route = require('../lib/route');

describe('Route', function(){
    describe('new', function(){
        it('should create route', function() {
            var route = new Route();
            expect(route).to.be.an('object');
        });
    });

    describe('#from()', function(){
        it('should accept uri string', function() {
            var route = new Route();
            route.from('mock:test');

            expect(route).to.be.an('object');
            expect(route.inputs[0].type).to.equal('mock$component');
        });

        it('should accept component object', function() {
            var route = new Route();
            route.from(Component.create(null, 'mock:test'));

            expect(route).to.be.an('object');
            expect(route.inputs[0].type).to.equal('mock$component');
        });
    });

    describe('#to()', function(){
        it('should accept uri string', function() {
            var route = new Route();
            route.to('mock:result');

            expect(route).to.be.an('object');
            expect(route.outputs[0].type).to.equal('mock$component');
        });

        it('should accept component object', function() {
            var route = new Route();
            route.to(Component.create(null, 'mock:test'));

            expect(route).to.be.an('object');
            expect(route.outputs[0].type).to.equal('mock$component');
        });
    });
});
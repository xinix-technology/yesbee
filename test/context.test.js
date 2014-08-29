var expect = require('chai').expect,
    Route = require('../lib/route'),
    Context = require('../lib/context'),
    ProducerTemplate = require('../lib/producer-template'),
    _ = require('lodash');

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

    describe('.from()', function(){
        it('should create a route', function() {
            var route = context.from('mock:test');

            expect(route).to.be.an('object');
            expect(route).to.be.an.instanceof(Route);
        });
    });

    describe('.start()', function() {
        it('should start all input components', function() {
            context.from('mock:test')
                .to('mock:result');

            context.start();

            _.each(context.routes, function(route) {
                _.each(route.inputs, function(input) {
                    expect(input.status).to.equal(1);
                });
            });
        });
    });

    describe('.stop()', function() {
        it('should stop all input components', function() {
            context.from('mock:test')
                .to('mock:result');

            context.stop();

            _.each(context.routes, function(route) {
                _.each(route.inputs, function(input) {
                    expect(input.status).to.equal(0);
                });
            });
        });
    });

    describe('.createProducerTemplate()', function() {
        it('should create new producer template', function() {
            var template = context.createProducerTemplate();

            expect(template).to.be.an.instanceof(ProducerTemplate);
        });

        it('should start if context start', function() {
            var template = context.createProducerTemplate();

            expect(template.status).to.be.equal(0);

            context.start();

            expect(template.status).to.be.equal(1);
        });

        it('should autostart if context already started', function() {
            context.start();

            var template = context.createProducerTemplate();

            expect(template.status).to.be.equal(1);
        });
    });
});
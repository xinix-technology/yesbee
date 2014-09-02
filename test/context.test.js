var expect = require('chai').expect,
    Route = require('../lib/route'),
    Context = require('../lib/context'),
    Component = require('../lib/component'),
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
            var route = context.from('direct:test');

            expect(route).to.be.an('object');
            expect(route).to.be.an.instanceof(Route);
        });
    });

    describe('.start()', function() {
        it('should start all input and output components', function() {
            context.from('direct:test')
                .to('direct:result');

            context.start();

            _.each(context.routes, function(route) {
                expect(route.source.status).to.equal(1, 'Inputs should started');

                _.each(route.processors, function(output) {
                    expect(output.status).to.equal(1, 'Outputs should started');
                });
            });
        });
    });

    describe('.stop()', function() {
        it('should stop all input and output components', function() {
            context.from('direct:test')
                .to('direct:result');

            context.stop();

            _.each(context.routes, function(route) {
                expect(route.source.status).to.equal(0, 'Inputs should stopped');

                _.each(route.processors, function(output) {
                    expect(output.status).to.equal(0, 'Outputs should stopped');
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

    describe('.createComponent()', function() {
        it('should return component', function() {
            var component = context.createComponent('direct:a');
            expect(component).to.be.instanceof(Component);
        });

        it('should return processor component if the first argument is function', function() {
            var component = context.createComponent(function() {

            });
            expect(component).to.be.instanceof(Component);
        });

        it('should throw error on empty argument', function() {
            expect(function() {
                var component = context.createComponent();
            }).to.throw(Error);
        });


        it('should throw error on wrong or unregistered protocol', function() {
            expect(function() {
                var component = context.createComponent('foo');
            }).to.throw(Error);

            expect(function() {
                var component = context.createComponent('foo:xxx');
            }).to.throw(Error);
        });
    });

    describe('.createSourceComponent()', function() {
        it('should return component with type source', function() {
            var component = context.createSourceComponent('direct:a');
            expect(component).to.be.instanceof(Component);
            expect(component.type).to.be.equal('source');
        });

        it('should throw error on already registered component uri as source', function() {
            expect(function() {
                var component = context.createSourceComponent('direct:a');
                component = context.createSourceComponent('direct:a');
            }).to.throw(Error);

            expect(function() {
                var component = context.createSourceComponent('direct:b');
                component = context.createSourceComponent('direct:b?with=options');
            }).to.throw(Error);

        });
    });
});
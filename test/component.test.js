var chai = require('chai'),
    expect = chai.expect,
    spies = require('chai-spies'),
    Context = require('../lib/context'),
    Exchange = require('../lib/exchange');
    Component = require('../lib/component');

chai.use(spies);

describe('Component', function(){
    "use strict";

    beforeEach(function(){
        this.context = new Context();
    });

    describe('#register()', function() {
        it('should able to register custom protocol', function() {
            Component.register('custom-protocol', {});
            expect(Component.registries['custom-protocol:']).to.be.an('object');
        });
    });

    // describe('#processor()', function() {
    //     it('should able to create processor-type component', function() {
    //         var component = Component.processor(function() { });
    //         expect(component).to.be.instanceof(Component);
    //     });

    //     it('should throw error on non function argument', function() {
    //         expect(function() {
    //             var component = Component.processor();
    //         }).to.throw(Error);

    //         expect(function() {
    //             var component = Component.processor('direct:x');
    //         }).to.throw(Error);

    //         expect(function() {
    //             var component = Component.processor({});
    //         }).to.throw(Error);

    //         expect(function() {
    //             var component = Component.processor([]);
    //         }).to.throw(Error);
    //     });
    // });

    describe('new', function() {
        it('should create new instance of component', function() {
            expect(new Component('direct:test')).to.be.instanceof(Component);
        });

        it('should throw error on non string uri argument', function() {
            expect(function() {
                var component = new Component(function() {});
            }).to.throw(Error);

            expect(function() {
                var component = new Component({});
            }).to.throw(Error);

            expect(function() {
                var component = new Component(123);
            }).to.throw(Error);
        });
    });

    describe('.start()', function() {
        it('should throw error if detached from context', function() {
            expect(function() {
                var component = new Component('direct:test');
                component.start();
            }).to.throw(Error);
        });

        it('should set status to 1', function() {
            var component = new Component('direct:test');
            component.context = this.context;

            expect(component.status).to.be.equal(0);

            component.start();

            expect(component.status).to.be.equal(1);
        });
    });

    describe('.stop()', function() {
        it('should set status to 0', function() {
            var component = new Component('direct:test');
            component.context = this.context;

            component.start();
            expect(component.status).to.be.equal(1);

            component.stop();
            expect(component.status).to.be.equal(0);

        });
    });

    describe('.process()', function() {
        it('has default process() method', function() {
            expect(new Component('direct:test')).to.be.respondTo('process');
        });
    });

    describe('.send()', function() {
        it('has default send() method', function() {
            expect(new Component('direct:test')).to.be.respondTo('send');
        });

        it('should throw error if detached from context', function() {
            expect(function() {
                var component = new Component('direct:test');
                component.send();
            }).to.throw(Error);
        });

        // TODO some new specs to be implemented later
        // it should hold the message for some moment until receiver alive
        // it should error if no receiver alive for several time
    });

    describe('.callback()', function() {
        it('has default callback() method', function() {
            expect(new Component('direct:test')).to.be.respondTo('callback');
        });

        // TODO some new specs
        // it should reach callback on last component send in inout route
    });

    describe('.initialize()', function() {
        it('has default initialize() method', function() {
            expect(new Component('direct:test')).to.be.respondTo('initialize');
        });
    });

    describe('.getNext()', function() {
        it('should return next processor', function() {
            var component = new Component('direct:source'),
                next = new Component('direct:destination');
            component.next = next;

            expect(component.getNext()).to.be.equal(next);
        });

        it('should return null if no next processor', function() {
            var component = new Component('direct:source');
            expect(component.getNext()).to.be.equal(null);
        });
    });

    describe('.doInit()', function() {
        // noop
    });

    describe('.doProcess()', function() {
        it('should return promise', function() {
            var component = new Component('direct:1');
            component.context = this.context;

            var result = component.doProcess(new Exchange());
            expect(result).not.to.be.equal(null);
            expect(result).to.be.respondTo('then');
        });

        it('should call .process()', function() {
            var component = new Component('direct:x'),
                x = new Exchange(),
                spy = chai.spy();

            component.process = spy;

            component.doProcess(x);

            expect(spy).to.have.been.called.with(x);
        });
    });

    describe('.doCallback()', function() {
        it('should call .callback()', function() {
            var component = new Component('direct:x'),
                x = new Exchange(),
                spy = chai.spy();

            component.callback = spy;

            component.doCallback(x);

            expect(spy).to.have.been.called.with(x);
        });
    });

    describe('.doSend()', function() {
        it('should send to next component', function(done) {

            var route = this.context.from('direct:a')
                .to(function() {
                    done();
                });

            // context.trace = true;
            this.context.start();

            var template = this.context.createProducerTemplate();
            var ex = template.createExchange('test-' + new Date());
            ex.pattern = 'inOnly';

            template.send('direct:a', ex);
        });

        it('should send to next component and purge to SINK for inOnly', function(done) {

            var spy = chai.spy(),
                spy2 = chai.spy();

            var route = this.context.from('direct:a')
                .to(spy);

            this.context.on('::SINK', spy2);

            // this.context.trace = true;
            this.context.start();

            var template = this.context.createProducerTemplate();
            var ex = template.createExchange('test-' + new Date());
            ex.pattern = 'inOnly';

            template.send('direct:a', ex);

            setTimeout(function() {
                expect(spy).to.have.been.called();
                expect(spy2).to.have.been.called();

                done();
            });

        });

        it('should send to next component and callback to source for inOut', function(done) {

            var processSpy = chai.spy(),
                sinkSpy = chai.spy(),
                callbackSpy = chai.spy();

            var route = this.context.from('direct:a?exchangePattern=inOut')
                .to(processSpy);

            this.context.on('::SINK', sinkSpy);

            var c = route.query('direct:a');
            c.callback = callbackSpy;

            // this.context.trace = true;
            this.context.start();

            var template = this.context.createProducerTemplate();
            template.send('direct:a', 'test-' + new Date());

            setTimeout(function() {
                expect(processSpy).to.have.been.called();
                expect(callbackSpy).to.have.been.called();
                expect(sinkSpy).to.have.not.been.called();

                done();
            });

        });

    });
});
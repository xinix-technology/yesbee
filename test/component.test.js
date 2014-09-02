var chai = require('chai'),
    expect = require('chai').expect,
    Component = require('../lib/component'),
    Context = require('../lib/context'),
    Exchange = require('../lib/exchange'),
    spies = require('chai-spies');

chai.use(spies);

describe('Component', function(){
    var context;

    beforeEach(function(){
        context = new Context();
    });

    describe('#register()', function() {
        it('should able to register custom protocol', function() {
            Component.register('custom-protocol', {});
            expect(Component.registries['custom-protocol:']).to.be.an('object');
        });
    });

    describe('#processor()', function() {
        it('should able to create processor-type component', function() {
            var component = Component.processor(function() { });
            expect(component).to.be.instanceof(Component);
        });

        it('should throw error on non function argument', function() {
            expect(function() {
                var component = Component.processor();
            }).to.throw(Error);

            expect(function() {
                var component = Component.processor('direct:x');
            }).to.throw(Error);

            expect(function() {
                var component = Component.processor({});
            }).to.throw(Error);

            expect(function() {
                var component = Component.processor([]);
            }).to.throw(Error);
        });
    });

    describe('new', function() {
        it('should create new instance of component', function() {
            var component = new Component('direct:test');
            expect(component).to.be.instanceof(Component);
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
            var component = context.createComponent('direct:test');

            expect(component.status).to.be.equal(0);

            component.start();

            expect(component.status).to.be.equal(1);
        });
    });

    describe('.stop()', function() {
        it('should set status to 0', function() {
            var component = context.createComponent('direct:test');

            component.start();
            expect(component.status).to.be.equal(1);

            component.stop();
            expect(component.status).to.be.equal(0);

        });
    });

    describe('.process()', function() {
        it('has default process() method', function() {
            var component = new Component('direct:test');

            expect(component.process).to.be.a('function');
        });
    });

    describe('.send()', function() {
        it('has default send() method', function() {
            var component = new Component('direct:test');

            expect(component.send).to.be.a('function');
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

    describe('.result()', function() {
        it('has default result() method', function() {
            var component = new Component('direct:test');

            expect(component.result).to.be.a('function');
        });

        // TODO some new specs
        // it should reach result on last component send in inout route
    });

    describe('.initialize()', function() {
        it('has default initialize() method', function() {
            var component = new Component('direct:test');

            expect(component.initialize).to.be.a('function');
        });
    });

    describe('.getNext()', function() {
        it('should return next processor', function() {
            var component = context.createComponent('direct:source'),
                next = context.createComponent('direct:destination');
            component.next = next;

            expect(component.getNext()).to.be.equal(next);
        });

        it('should return null if no next processor', function() {
            var component = context.createComponent('direct:source');
            expect(component.getNext()).to.be.null;
        });
    });

    describe('.doInit()', function() {
        // noop
    });

    describe('.doProcess()', function() {
        it('should return promise', function() {
            var component = context.createComponent('direct:1');
            var result = component.doProcess(new Exchange());
            expect(result).not.to.be.null;
            expect(result.then).to.be.a('function');
        });

        it('should call .process()', function() {
            var spy = chai.spy(),
                component = Component.processor(spy),
                x = new Exchange();

            component.doProcess(x);

            expect(spy).to.have.been.called.with(x);
        });
    });

    describe('.doResult()', function() {
        it('should call .result()', function() {
            var component = context.createComponent('direct:x'),
                x = new Exchange(),
                spy = chai.spy(component.result);

            component.result = spy;

            component.doResult(x);

            expect(spy).to.have.been.called.once.with(x);
        });
    });

    describe('.doSend()', function() {
        it('should send to next component', function(done) {

            var route = context.from('direct:a')
                .to(function() {
                    done();
                });

            // context.trace = true;
            context.start();

            var template = context.createProducerTemplate();
            var ex = template.createExchange('test-' + new Date());
            ex.pattern = 'inOnly';

            template.send('direct:a', ex);
        });

        it('should send to next component and purge to SINK for inOnly', function(done) {

            var spy = chai.spy(),
                spy2 = chai.spy();

            var route = context.from('direct:a')
                .to(spy);

            context.on('::SINK', spy2);

            // context.trace = true;
            context.start();

            var template = context.createProducerTemplate();
            var ex = template.createExchange('test-' + new Date());
            ex.pattern = 'inOnly';

            template.send('direct:a', ex);

            setTimeout(function() {
                expect(spy).to.have.been.called();
                expect(spy2).to.have.been.called();

                done();
            }, 1);

        });

        it('should send to next component and result to source for inOut', function(done) {

            var spy = chai.spy(),
                spy2 = chai.spy(),
                spy3;

            var route = context.from('direct:a?exchangePattern=inOut')
                .to(spy);

            context.on('::SINK', spy2);

            var c = route.query('direct:a');
            spy3 = chai.spy(c.result);
            c.result = spy3;

            // context.trace = true;
            context.start();

            var template = context.createProducerTemplate();
            template.send('direct:a', 'test-' + new Date());

            setTimeout(function() {
                expect(spy).to.have.been.called();
                expect(spy2).to.have.not.been.called();
                expect(spy3).to.have.been.called();

                done();
            }, 10);

        });

    });
});
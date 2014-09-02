var expect = require('chai').expect,
    chai = require('chai'),
    path = require('path'),
    container = require('../lib/container'),
    Registry = require('../lib/registry'),
    Container = container.Container,
    spies = require('chai-spies');

chai.use(spies);

describe('Container', function(){
    var container;
    beforeEach(function() {
        container = new Container(path.resolve('./test/000-container'));
    });

    describe('require', function(){
        it('should get instance of container', function() {
            expect(container).to.be.instanceof(Container);
        });
    });

    describe('.new()', function(){
        it('should create new container', function() {
            var container = new Container();
            expect(container).to.be.instanceof(Container);
            expect(container).to.not.have.key('Container');
        });
    });

    describe('.populateScripts()', function(){
        it('should populate script from path', function() {
            var scripts = container.populateScripts(path.join(container.props.container, 'services'));
            expect(scripts).to.have.keys(['dummy', 'dummy-1']);
        });
    });

    describe('.populateServices()', function(){
        it('should populate services', function() {
            expect(container.registry).to.be.empty;
            var services = container.populateServices();
            expect(container.registry).to.be.instanceof(Registry);
            expect(container.registry.data).to.be.not.empty;
        });
    });

    describe('.getRegistry()', function(){
        it('should produce singleton', function() {
            expect(container.getRegistry()).to.be.equal(container.getRegistry());
        });
    });

    describe('.startService', function() {
        it('should start specified service', function() {
            container.startService('dummy');
            expect(container.getRegistry().get('services::dummy').context.status).to.be.equal(1);
        });
    });

    describe('.stopService', function() {
        it('should stop specified service', function() {
            container.startService('dummy');
            expect(container.getRegistry().get('services::dummy').context.status).to.be.equal(1);
            container.stopService('dummy');
            expect(container.getRegistry().get('services::dummy').context.status).to.be.equal(0);
        });
    });

    describe('.startServer', function() {
        it('should start tcp server', function() {

        });
    });

    describe('.start()', function(){
        it('should populate services', function() {
            container.startServer = chai.spy();

            container.start();

            var services = container.getRegistry().find('services::*');
            expect(services).has.length(3);
        });

        it('should autostart services', function() {
            var spy = chai.spy(container.startService);

            container.props.autostart = ['dummy'];
            container.startService = spy;
            container.startServer = chai.spy();
            container.start();

            expect(spy).to.have.been.called();
        });

        // it('should start server', function() {
        //     // TODO how to express server started
        //     container.start();

        // });
    });

    describe('.stop()', function() {
        it('should stop server', function(done) {
            var spy = chai.spy();

            container.start();

            container.server.s.on('listening', function() {

                container.server.s.on('close', spy);

                container.stop();

                setTimeout(function() {

                    expect(spy).to.have.been.called();
                    done();
                });

            });
        });
    });
});
var expect = require('chai').expect,
    chai = require('chai'),
    path = require('path'),
    manager = require('../lib/manager'),
    Registry = require('../lib/registry'),
    Manager = manager.Manager,
    spies = require('chai-spies');

chai.use(spies);

describe('Manager', function(){
    var m;
    beforeEach(function() {
        m = new Manager(path.resolve('./test/000-container'));
    });

    describe('require', function(){
        it('should get instance of manager', function() {
            expect(manager).to.be.instanceof(Manager);
        });
    });

    describe('.new()', function(){
        it('should create new manager', function() {
            var m = new Manager();
            expect(m).to.be.instanceof(Manager);
            expect(m).to.not.have.key('Manager');
        });
    });

    describe('.populateScripts()', function(){
        it('should populate script from path', function() {
            var scripts = m.populateScripts(path.join(m.props.container, 'services'));
            expect(scripts).to.have.keys(['dummy', 'dummy-1']);
        });
    });

    describe('.populateServices()', function(){
        it('should populate services', function() {
            expect(m.registry).to.be.empty;
            var services = m.populateServices();
            expect(m.registry).to.be.instanceof(Registry);
            expect(m.registry.data).to.be.not.empty;
        });
    });

    describe('.getRegistry()', function(){
        it('should produce singleton', function() {
            expect(m.getRegistry()).to.be.equal(m.getRegistry());
        });
    });

    describe('.startService', function() {
        it('should start specified service', function() {
            m.startService('dummy');
            expect(m.getRegistry().get('services::dummy').context.status).to.be.equal(1);
        });
    });

    describe('.stopService', function() {
        it('should stop specified service', function() {
            m.startService('dummy');
            expect(m.getRegistry().get('services::dummy').context.status).to.be.equal(1);
            m.stopService('dummy');
            expect(m.getRegistry().get('services::dummy').context.status).to.be.equal(0);
        });
    });

    describe('.startServer', function() {
        it('should start tcp server', function() {

        });
    });

    describe('.start()', function(){
        it('should populate services', function() {
            m.startServer = chai.spy();

            m.start();

            var services = m.getRegistry().find('services::*');
            expect(services).has.length(3);
        });

        it('should autostart services', function() {
            var spy = chai.spy(m.startService);

            m.autostart = ['dummy'];
            m.startService = spy;
            m.startServer = chai.spy();

            m.start();

            expect(spy).to.have.been.called();
        });

        // it('should start server', function() {
        //     // TODO how to express server started
        //     m.start();

        // });
    });

    describe('.stop()', function() {
        it('should stop server', function(done) {
            var spy = chai.spy();

            m.start();

            m.server.s.on('listening', function() {

                m.server.s.on('close', spy);

                m.stop();

                setTimeout(function() {

                    expect(spy).to.have.been.called();
                    done();
                });

            });
        });
    });
});
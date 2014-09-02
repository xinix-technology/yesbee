var chai = require('chai'),
    expect = chai.expect,
    Context = require('../../lib/context'),
    Channel = require('../../lib/channel'),
    Exchange = require('../../lib/exchange'),
    Component = require('../../lib/component'),
    spies = require('chai-spies');

chai.use(spies);

describe('HTTP Inbound Component', function(){
    var context;
    var $http;
    beforeEach(function() {
        $http = {};

        Channel.instance = new Channel();

        context = Context.create();
        context.getRegistry().put('services::http', {
            context: $http
        });
    });

    describe('new', function() {
        it('should specify valid url as first argument', function() {
            expect(new Component('http-inbound:http://0.0.0.0')).to.be.instanceof(Component);
            expect(new Component('http-inbound:http://localhost/test')).to.be.instanceof(Component);
            expect(new Component('http-inbound:http://localhost/hello?with=param')).to.be.instanceof(Component);
        });

        it('should extract options correctly', function() {
            var c = new Component('http-inbound:http://0.0.0.0?with=param', {another: 'param'});
            expect(c.options).to.include.keys(['with', 'another']);

            c = new Component('http-inbound:http://0.0.0.0?with=param');
            expect(c.options.timeout + '').to.be.eql('30000');

            c = new Component('http-inbound:http://0.0.0.0?with=param&timeout=5000', {another: 'param'});
            expect(c.options.timeout + '').to.be.eql('5000');

            c = new Component('http-inbound:http://0.0.0.0?with=param&timeout=5000', {another: 'param', timeout: 3000});
            expect(c.options.timeout + '').to.be.eql('3000');
        });
    });

    describe('.start()', function() {
        it('should invoke http service attach', function() {
            var route = context.from('http-inbound:http://0.0.0.0')
                .to(function() {
                    console.log('888888888888');
                });

            var c = route.query('http-inbound:http://0.0.0.0');

            $http.attach = chai.spy();

            context.start();

            expect($http.attach).to.be.called();
        });
    });

    describe('.stop()', function() {
        it('should invoke http service detach', function() {
            var route = context.from('http-inbound:http://0.0.0.0')
                .to(function() {
                    console.log('888888888888');
                });

            var c = route.query('http-inbound:http://0.0.0.0');

            $http.detach = chai.spy();

            context.stop();

            expect($http.detach).to.be.called();
        });
    });

    describe('.getHttpService()', function() {
        it('should return http service', function() {
            var s = context.createComponent('http-inbound:http://localhost').getHttpService();
            expect(s).to.be.an('object');
        });
    });

    describe('.consume()', function() {
        it('should send message to IN channel', function() {
            var c = context.createComponent('http-inbound:http://localhost'),
                exchange = new Exchange(),
                spy = chai.spy();

            context.on(c.getChannelId(Channel.IN), spy);

            c.consume(exchange);

            expect(spy).to.be.called();
        });

        it('should send message back immediately to CALLBACK channel if pattern inOnly', function() {
            var c = context.createComponent('http-inbound:http://localhost?exchangePattern=inOnly'),
                exchange = new Exchange(),
                spy = chai.spy();

            context.on('test', spy);

            context.start = true;

            exchange.property('callback', 'test');

            c.doConsume(exchange);

            expect(spy).to.be.called();
        });

        it('should send timeout to CALLBACK channel if pattern inOut', function(done) {
            var c = context.createComponent('http-inbound:http://localhost?timeout=1'),
                exchange = new Exchange();

            context.on('test', function(exc) {
                expect(exc.error).to.be.instanceof(Error);
                done();
            });

            exchange.property('callback', 'test');

            c.consume(exchange);
        });

    });

    describe('.result()', function() {

        it('should send result to CALLBACK channel', function(done) {
            var c = context.createComponent('http-inbound:http://localhost'),
                exchange = new Exchange();

            context.on('test', function(exc) {
                done();
            });

            exchange.pattern = 'inOut';
            exchange.property('callback', 'test');

            c.consume(exchange);
            setTimeout(function() {
                c.result(exchange);
            }, 10);
        });

    });


});
var chai = require('chai'),
    expect = chai.expect,
    Context = require('../../lib/context'),
    channel = require('../../channel'),
    Channel = channel.Channel,
    Exchange = require('../../lib/exchange'),
    Component = require('../../lib/component'),
    spies = require('chai-spies');

chai.use(spies);

describe('HTTP Inbound Component', function(){
    "use strict";

    beforeEach(function() {
        this.$http = {};

        Channel.instance = new Channel();

        this.context = Context.create();
        this.context.getRegistry().put('services::http', {
            context: this.$http
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
            var route = this.context.from('http-inbound:http://0.0.0.0')
                .to(function() {
                    console.log('888888888888');
                });

            var c = route.query('http-inbound:http://0.0.0.0');

            this.$http.attach = chai.spy();

            this.context.start();

            expect(this.$http.attach).to.be.called();
        });
    });

    describe('.stop()', function() {
        it('should invoke http service detach', function() {
            var route = this.context.from('http-inbound:http://0.0.0.0')
                .to(function() {
                    console.log('888888888888');
                });

            var c = route.query('http-inbound:http://0.0.0.0');

            this.$http.detach = chai.spy();

            this.context.stop();

            expect(this.$http.detach).to.be.called();
        });
    });

    describe('.getHttpService()', function() {
        it('should return http service', function() {
            var s = this.context.createComponent('http-inbound:http://localhost').getHttpService();
            expect(s).to.be.an('object');
        });
    });

    describe('.process()', function() {
        it('should send message to next component', function() {
            var component = this.context.createComponent('http-inbound:http://localhost');
            var exchange = new Exchange();

            console.log(component);
            component.process(exchange);
            console.log(component);

            // expect(spy).to.be.called();
        });

        // it('should send message back immediately to CALLBACK channel if pattern inOnly', function() {
        //     var c = this.context.createComponent('http-inbound:http://localhost?exchangePattern=inOnly'),
        //         exchange = new Exchange(),
        //         spy = chai.spy();

        //     this.context.on('test', spy);

        //     this.context.start = true;

        //     exchange.property('callback', 'test');

        //     c.doConsume(exchange);

        //     expect(spy).to.be.called();
        // });

        // it('should send timeout to CALLBACK channel if pattern inOut', function(done) {
        //     var c = this.context.createComponent('http-inbound:http://localhost?timeout=1'),
        //         exchange = new Exchange();

        //     this.context.on('test', function(exc) {
        //         expect(exc.error).to.be.instanceof(Error);
        //         done();
        //     });

        //     exchange.property('callback', 'test');

        //     c.consume(exchange);
        // });

    });

    describe('.callback()', function() {

        // it('should send callback', function(done) {
        //     var c = this.context.createComponent('http-inbound:http://localhost'),
        //         exchange = new Exchange();

        //     this.context.on('test', function(exc) {
        //         done();
        //     });

        //     exchange.pattern = 'inOut';
        //     exchange.property('callback', 'test');

        //     c.process(exchange);
        //     setTimeout(function() {
        //         c.callback(exchange);
        //     }, 10);
        // });

    });


});
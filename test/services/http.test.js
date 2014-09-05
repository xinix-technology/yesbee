var chai = require('chai'),
    expect = chai.expect,
    Context = require('../../lib/context'),
    httpService = require('../../lib/services/http'),
    Component = require('../../lib/component'),
    Exchange = require('../../lib/exchange'),
    Channel = require('../../lib/channel'),
    http = require('http'),
    _ = require('lodash'),
    Q = require('q'),
    spies = require('chai-spies');

chai.use(spies);


describe('Service::Http', function(){
    var $http;

    beforeEach(function() {
        $http = Context.create(httpService);
        // $http.trace = true;
    });

    /**
     * Create mock handler
     * @param  string uri
     * @return Component
     */
    var createHandler = function(uri) {
        var c = $http.createComponent(function() {
            console.log('proc');
        });
        // c.uri = 'processor:' + uri;
        return c;
    };

    afterEach(function(done) {
        var promises = _.map($http.servers, function(server) {
            return server.close(true);
        });

        if (promises.length === 0) {
            done();
        } else {
            Q.when(promises).then(function() {
                done();
            });
        }

    });

    describe('Context#create', function(){
        it('should create new http service', function() {
            var context = Context.create(httpService);

            expect(context).to.be.instanceof(Context);
        });
    });

    describe('.get()', function() {
        it('should return new server if no server exists yet', function() {
            expect($http.servers).not.has.key('0.0.0.0:3030');
            var s = $http.get('http://0.0.0.0:3030');
            expect($http.servers).has.key('0.0.0.0:3030');
            expect(s).to.be.instanceof(httpService.Server);
        });

        it('should return same server if available', function() {
            var s = $http.get('http://0.0.0.0:3030'),
                s2 = $http.get('http://0.0.0.0:3030/home');
            expect(s2).to.be.equal(s);
        });
    });

    describe('.attach()', function(){
        it('should attach new uri handler to specified server', function() {
            var uri = 'http://0.0.0.0:3030/test',
                host = 'http://0.0.0.0:3030',
                c = createHandler(uri),
                s = $http.get(host);

            expect(s.routes).not.has.key('/test');
            $http.attach(uri, c);
            expect(s.routes).has.key('/test');
        });
    });

    describe('.detach()', function(){
        it('should detach new uri handler to specified server', function() {
            var uri = 'http://0.0.0.0:3030/test',
                host = 'http://0.0.0.0:3030',
                c = createHandler(uri),
                s = $http.get(host);

            $http.attach(uri, c);
            expect(s.routes).has.key('/test');

            $http.detach(uri, c);
            expect(s.routes).not.has.key('/test');
        });
    });

    describe('Server', function() {
        var server;

        beforeEach(function() {
            server = new httpService.Server($http, 'http://localhost:3031');
        });

        afterEach(function(done) {
            // console.log('done');
            server.close(true).then(function() {
                // console.log('done1');
                done();
            }, function(e) {
                // console.log('done2');
                done();
            });
        });

        describe('new', function() {
            it('should only accepted uri as argument', function() {
                expect(function() {
                    var s = new httpService.Server();
                }).to.throw(Error);

                expect(function() {
                    var s = new httpService.Server($http, 'http://localhost:3031');
                }).not.to.throw(Error);
            });
        });

        describe('.normalizePath()', function() {
            it('should return normalized path', function() {
                var p = server.normalizePath('/anu/itu/');
                expect(p).to.be.eql('/anu/itu');
            });
        });

        describe('.route()', function() {
            it('should put route handler for specified pathname', function() {
                var handler = createHandler('http://localhost:3031');
                expect(server.routes).not.have.key('/anu/itu');
                server.route('/anu/itu', handler);
                expect(server.routes).have.key('/anu/itu');
            });
        });

        describe('.deroute()', function() {
            it('should remove route handler for specified pathname', function() {
                var handler = createHandler('http://localhost:3031');

                server.route('/anu/itu', handler);
                expect(server.routes).have.key('/anu/itu');

                server.deroute('/anu/itu', handler);
                expect(server.routes).not.have.key('/anu/itu');
            });
        });

        describe('.listen()', function() {
            // it('should return promise', function() {
            //     var promise = server.listen();
            //     expect(promise).to.respondTo('then');
            // });

            it('should listen server for specified uri', function(done) {
                var promise = server.listen();

                server.listen().then(function() {
                    http.get("http://localhost:3031", function(res) {
                        // console.log("Got response: " + res.statusCode);
                        done();
                    });
                });
            });
        });

        describe('.serve()', function() {
            it('should send to in channel of handler', function(done) {
                var req = new http.IncomingMessage(),
                    res = new http.ServerResponse('get');

                req.url = '/anu/itu';

                var handler = createHandler(),
                    spy = chai.spy();
                var inChannelId = handler.getChannelId(Channel.IN);

                $http.on(inChannelId, function(exchange) {
                    // console.log(exchange);
                    done();
                });

                server.route('/', handler);
                server.serve(req, res);
            });
        });

        describe('.callback()', function() {
            it('should send response', function() {
                var req = new http.IncomingMessage(),
                    res = new http.ServerResponse('get'),
                    exchange = new Exchange();

                res.end = chai.spy();

                server.addScope(exchange, req, res);
                server.callback(exchange);

                expect(res.end).to.be.called();
            });
        });

        describe('.close()', function() {
            // TODO destiny is unwritten
        });
    });

});
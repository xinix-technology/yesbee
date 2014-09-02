var expect = require('chai').expect,
    Registry = require('../lib/registry');

describe('Registry', function(){
    describe('#create()', function() {
        it('should get singleton instance of registry', function() {
            var registry1 = Registry.create();
            var registry2 = Registry.create();

            expect(registry1).to.be.equal(registry2);
        });
    });

    describe('.put()', function() {
        it('should put to registry', function() {
            var registry = new Registry();

            registry.put('test', 1);

            expect(registry).has.key('data');
            expect(registry).not.has.key('x');
        });

        it('should throw error if first argument is not string', function() {
            expect(function() {
                var registry = new Registry();

                registry.put(function() {}, 1);
            }).to.throw(Error);
        });
    });

    describe('.get()', function() {
        it('should get from registry', function() {
            var registry = new Registry();

            registry.put('test', 1);
            registry.put('test::anu', 1);

            var o = registry.get('test');

            expect(o).to.be.equal(1);
        });

        it('should throw error if first argument is not string', function() {
            expect(function() {
                var registry = new Registry();


                registry.put('test', 1);

                var o = registry.get([]);
            }).to.throw(Error);
        });

    });

    describe('.find()', function() {
        it('should get wildcarded', function() {
            var registry = new Registry();

            registry.put('test::satu::anu', 1);
            registry.put('test::satu::itu', 2);
            registry.put('test::dua', 2);

            var o;

            o = registry.find('test::*');
            expect(o).to.have.length(1);

            o = registry.find('test::*::*');
            expect(o).to.have.length(2);

            o = registry.find('*::satu::*');
            expect(o).to.have.length(2);
        });
    });

    // describe('require', function(){
    //     it('should get instance of container', function() {
    //         expect(container).to.be.instanceof(Container);
    //     });
    // });
});
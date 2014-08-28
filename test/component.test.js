var assert = require("assert");

var Component = require('../lib/component');

describe('Component', function(){
    describe('.register()', function() {
        it('should able to register custom protocol', function() {
            Component.register('custom-protocol', {});
            assert.equal(typeof Component.registries['custom-protocol:'], 'object');
        });
    });

    describe('.create()', function(){
        it('should throw error on unknown uri', function() {
            var c;
            try {
                c = Component.create(null);
                throw new Error('Unthrown error');
            } catch(e) {
            }

            try {
                c = Component.create(null, 'foo');
                throw new Error('Unthrown error');
            } catch(e) {
            }
        });

        it('should throw error on unknown unregistered protocol', function() {
            try {
                var c = Component.create(null, 'bar:xxx');
                throw new Error('Unthrown error');
            } catch(e) {
            }
        });

        it('should return mock component with mock uri', function() {
            var c = Component.create(null, 'mock:test');
            assert.equal(typeof c, 'object');
        });
    });
});
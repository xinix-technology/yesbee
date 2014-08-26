var assert = require("assert")

var Component = require('../lib/component');

describe('Component', function(){
    describe('.create()', function(){
        it('should throw error on unknown uri', function() {
            try {
                var c = Component.create();
                throw new Error('Unthrown error');
            } catch(e) {

            }

            try {
                var c = Component.create('foo');
                throw new Error('Unthrown error');
            } catch(e) {

            }
        });

        it('should throw error on unknown unregistered protocol', function() {
            try {
                var c = Component.create('bar:xxx');
                throw new Error('Unthrown error');
            } catch(e) {

            }
        });

        it('should return mock component with mock uri', function() {
            var c = Component.create('mock:test');
            assert.equal(typeof c, 'object');
        });
    });
});
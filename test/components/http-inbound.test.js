var expect = require('chai').expect;

var Component = require('../../lib/component');

describe('Component::Http', function(){
    describe('.start()', function() {
        it('should listen at specified address and port', function(done) {
            var component = Component.create(null, 'http://localhost:3000/anu/itu/?huer#xxx');
            component.start().then(function() {
                done();
            });
        });
    });
});
var Table = require('easy-table'),
    _ = require('lodash');

module.exports = function() {
    "use strict";

    var services = this.container.find('services::*'),
        t = new Table();


    // c.write('Services:\n');
    _.each(services, function(service) {
        t.cell('Name', service.name);
        t.cell('Status', (service.status) ? 'running' : 'stopped');
        t.newRow();
    });

    this.write(t.toString());
};
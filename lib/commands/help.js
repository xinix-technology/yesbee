var Table = require('easy-table');

module.exports = function() {
    "use strict";

    this.write(Table.printArray([
        {
            'Command': 'help',
            'Description': 'Show help'
        },
        {
            'Command': 'start'
        },
        {
            'Command': 'stop'
        },
        {
            'Command': 'quit'
        },
        {
            'Command': 'shutdown'
        },
    ]));
};
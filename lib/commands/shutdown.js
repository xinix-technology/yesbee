module.exports = function() {
    "use strict";

    this.container.stop();
    this.end('Good bye!\n');

    return false;
};
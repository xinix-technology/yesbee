module.exports = function(serviceName) {
    "use strict";

    try {
        this.container.get('services::' + serviceName).start();
    } catch(e) {
        this.write(e.message + '\n');
    }
};
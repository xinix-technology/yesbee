module.exports = function(serviceName) {
    try {
        this.container.get('services::' + serviceName).stop();
    } catch(e) {
        this.write(e.message + '\n');
    }
};
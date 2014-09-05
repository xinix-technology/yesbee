module.exports = {
    strategies: {
        first: function(oldExchange, newExchange) {
            if (!oldExchange) {
                return newExchange;
            }

            return oldExchange;
        }
    },

    getStrategy: function(name) {
        return this.strategies[name] || null;
    },

    addStrategy: function(name, fn) {
        this.strategies[name] = fn;
    }
};
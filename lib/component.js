var url = require('url'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    path = require('path'),
    logger = require('./logger'),
    qs = require('querystring'),
    _ = require('lodash'),
    Q = require('q'),
    Exchange = require('./exchange'),
    Channel = require('./channel');

var Component = function(uri, options) {
    if (arguments.length < 1) {
        throw new Error('Component should have uri and (optional) options');
    }

    if (typeof uri !== 'string') {
        throw new Error('Component uri argument must be string');
    }

    this.clazz = '$component';
    this.componentClass = null;
    this.type = 'processor';

    this.id = Component.generateId();
    this.uri = null;
    this.scopes = {};

    this.status = 0;

    this.route = null;
    this.next = null;

    this.doInit(uri, options);
};

Component.ID = 0;
Component.PROCESSOR_ID = 0;
Component.registries = {};

Component.generateId = function() {
    // use simple id instead of uuid
    return 'component-' + Component.ID++;
    // return 'component/' + uuid.v1();
};

Component.register = function(name, clazz) {
    this.registries[name + ':'] = clazz;
};

// DEPRECATED
// Component.processor = function(o, options) {
//     if (typeof o !== 'function') {
//         throw new Error('Processor-type component should have process function as argument');
//     }

//     var component = new Component('processor:' + Component.PROCESSOR_ID++, options);
//     component.process = o;
//     return component;
// };

Component.prototype.start = function() {
    if (!this.context) {
        throw new Error('Cannot start from detached component from context');
    }

    this.startListening();

    this.scopes = {};
    this.status = 1;
};

Component.prototype.stop = function() {
    // logger.i(this.id, 'stopping...');
    this.status = 0;

    this.stopListening();
};

Component.prototype.startListening = function() {
    var that = this;

    // logger.i(that.id, "Start listening");
    _.each(this.getChannels(), function(channel) {
        // logger.i(that.id, channel.id, channel.listener);
        that.context.on(channel.id, channel.listener);
    });
};

Component.prototype.stopListening = function() {
    var that = this;

    _.each(this.getChannels(), function(channel) {
        that.context.removeListener(channel.id, channel.listener);
    });

    delete this.channels;
};

Component.prototype.process = function(exchange) {
    // noop
};

Component.prototype.send = function(channelType, to, exchange) {
    if (!this.context) {
        throw new Error('Cannot send from detached component from context');
    }

    this.context.send(channelType, to, exchange, this);
};

Component.prototype.callback = function(exchange) {
    // noop
};

Component.prototype.initialize = function(exchange) {
    // noop
};

Component.prototype.getNext = function(exchange) {
    return this.next;
};

Component.prototype.doInit = function(uri, options) {
    var type, parsed, plugin;

    uri = uri.trim();

    if (uri.match(':')) {
        var splitted = uri.split(':');
        type = splitted[0];
    }

    // test type of protocol should be valid protocol registered
    if (!type) {
        throw new Error('Unparsed protocol from uri: "' + uri + '".');
    }

    plugin = Component.registries[type + ':'];
    if (!plugin) {
        throw new Error('Protocol "' + type + '" not found.');
    }

    // extend object with plugin
    _.extend(this, plugin);


    parsed = url.parse(uri);

    var queryStringOptions = qs.parse(parsed.query);
    var search = parsed.search || '';

    uri = uri.substr(0, uri.length - search.length);

    this.componentClass = type;

    this.uri = uri;

    var defaultOptions = {
        exchangePattern: 'inOnly',
        timeout: 30000
    };
    this.options = _.extend(defaultOptions, this.options);
    this.options = _.extend(this.options, queryStringOptions);
    this.options = _.extend(this.options, options);

    this.initialize();
};

Component.prototype.doProcess = function(exchange) {
    if (!(exchange instanceof Exchange)) {
        throw new Error('Argument should be an Exchange instance');
    }

    var that = this,
        timeout;

    if (this.type === 'source') {
        var cloneExchange = exchange.clone();

        cloneExchange.source = this;
        cloneExchange.pattern = this.options.exchangePattern;

        exchange = cloneExchange;

        var callbackChannel = exchange.property('callback');
        if (callbackChannel) {
            if (exchange.pattern === 'inOnly') {
                this.context.getChannel().emit(callbackChannel, exchange);
            } else {
                timeout = setTimeout(function() {
                    that.removeScope(exchange);

                    if (!exchange.error) {
                        exchange.error = new Error('Timeout executing route');
                    }

                    that.context.getChannel().emit(callbackChannel, exchange);

                }, this.options.timeout);

                this.addScope(exchange, {
                    timeout: timeout
                });
            }
        }

    }

    // console.log('--------> process:' + this.id);

    return Q(this.process(exchange)).then(function(newExchange) {
        if (newExchange instanceof Exchange) {
            exchange = newExchange;
        } else if (typeof newExchange !== 'undefined') {
            exchange.body = newExchange;
        }
        that.doSend(exchange);
    });
};

// DEPRECATED
// Component.prototype.doResult = function(exchange) {
//     if (!(exchange instanceof Exchange)) {
//         throw new Error('Argument should be an Exchange instance');
//     }

//     // console.log('--------> result:' + this.id);

//     return this.result(exchange);
// };

Component.prototype.doCallback = function(exchange) {
    if (!(exchange instanceof Exchange)) {
        throw new Error('Argument should be an Exchange instance');
    }

    var that = this;

    // console.log('--------> callback:' + this.id);

    return Q(this.callback(exchange)).then(function(newExchange) {
        if (newExchange instanceof Exchange) {
            exchange = newExchange;
        } else if (typeof newExchange !== 'undefined') {
            exchange.body = newExchange;
        }

        if (that.type === 'source') {
            var callbackChannel = exchange.property('callback');

            if (callbackChannel) {
                // console.log('SEND BACK TO CALLER', callbackChannel);
                that.context.getChannel().emit(callbackChannel, exchange);
            }

            if (that.scopes[exchange.id]) {
                that.removeScope(exchange);
            }
        } else {
            // console.log(exchange);
            // console.log('id', this.id);
            // console.log('src', exchange.source + '', exchange.pattern);
            // console.log('next', this.getNext(exchange) + '');
            // console.log('ch', this.getChannelId(Channel.OUT, exchange.source), this.context.getChannelId(Channel.OUT, exchange.source));
            // exchange.TEST = 1;
            // this.doSend(exchange);
        }
    });
};

Component.prototype.doSend = function(exchange) {

    if (!(exchange instanceof Exchange)) {
        throw new Error('Argument should be an Exchange instance');
    }

    // console.log('--------> send:' + this.id);

    var to = this.getNext(exchange),
        channel;

    if (to && !exchange.error) {
        return this.send(Channel.IN, to, exchange);
    } else {
        to = exchange.source;
        if (to && exchange.pattern == 'inOut') {
            return this.send(Channel.OUT, to, exchange);
        } else {
            return this.context.send(Channel.SINK, null, exchange, this);
        }
    }

};

// no test /////////////////////////////////////////////////////////////////////
Component.prototype.toString = function() {
    return '<' + this.uri + ' ' + (this.type === 'source' ? 'S' : '') + '#' + this.id + '>';
};

// DEPRECATED
// Component.prototype.doConsume = function(exchange) {

//     // console.log('--------> consume:' + this.id);

//     var cloneExchange = exchange.clone();

//     cloneExchange.source = this;
//     cloneExchange.pattern = this.options.exchangePattern;

//     return this.consume(cloneExchange);
// };

// DEPRECATED
// Component.prototype.doProduce = function() {
//     return this.produce(exchange);
// };

// DEPRECATED
// Component.prototype.consume = function(exchange) {
//     throw new Error('Cannot consume exchange, maybe you are using non-source component as "source"');
//     // noop
// };

// DEPRECATED
// Component.prototype.produce = function() {
//     // noop
// };

Component.prototype.getChannels = function() {
    var that = this;
    if (!this.channels) {
        this.channels =  [
            {
                id: this.getChannelId(Channel.IN),
                listener: function(exchange) {
                    try {
                        Q(that.doProcess(exchange))
                            .fail(function(e) {
                                logger.e(e.message + "\n" + e.stack);
                            });
                    } catch(e) {
                        logger.e(e.message + "\n" + e.stack);
                    }
                }
            },
            {
                id: this.getChannelId(Channel.OUT),
                listener: function(exchange) {
                    try {
                        Q(that.doCallback(exchange))
                            .fail(function(e) {
                                logger.e(e.message + "\n" + e.stack);
                            });
                    } catch(e) {
                        logger.e(e.message + "\n" + e.stack);
                    }
                }
            }
            // ,
            // {
            //     id: this.getChannelId(Channel.CONSUMER),
            //     listener: function(exchange) {
            //         try {
            //             Q(that.doConsume(exchange))
            //                 .fail(function(e) {
            //                     logger.e(e.message + "\n" + e.stack);
            //                 });
            //         } catch(e) {
            //             logger.e(e.message + "\n" + e.stack);
            //         }
            //     }
            // },
            // {
            //     id: this.getChannelId(Channel.CALLBACK),
            //     listener: function(exchange) {
            //         try {
            //             Q(that.doCallback(exchange))
            //                 .fail(function(e) {
            //                     logger.e(e.message + "\n" + e.stack);
            //                 });
            //         } catch(e) {
            //             logger.e(e.message + "\n" + e.stack);
            //         }
            //     }
            // }
        ];
    }

    return this.channels;
};

Component.prototype.getChannelId = function(type) {
    if (!this.context) {
        throw new Error('Cannot found channel id for null context');
    }
    return this.context.getChannelId(type, this);
};

Component.prototype.addScope = function(exchange, data) {
    this.scopes[exchange.id] = {
        exchange: exchange,
        data: data || {}
    };
};

Component.prototype.removeScope = function(exchange) {
    if (this.scopes[exchange.id]) {
        if (this.scopes[exchange.id].data.timeout) {
            clearTimeout(this.scopes[exchange.id].data.timeout);
        }
        delete this.scopes[exchange.id];
    }
};

// no test /////////////////////////////////////////////////////////////////////

// init
var internals = fs.readdirSync(path.join(__dirname, 'components'));
internals.forEach(function(f) {
    var ext = path.extname(f);
    if (ext == '.js') {
        var name = path.basename(f, ext);
        Component.register(name, require('./components/' + name));
    } else {
        logger.e('Cannot populate non javascript file yet!');
    }
});

module.exports = Component;
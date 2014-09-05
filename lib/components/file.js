var Q = require('q'),
    Exchange = require('../exchange'),
    Channel = require('../channel'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    mkdirp = require('mkdirp');

var File = function(filePath) {
    this.type = 'file';
    this.filePath = filePath;
};

File.prototype.pipe = function(stream) {
    try {

        var deferred = Q.defer();
        var readStream = fs.createReadStream(this.filePath);

        readStream.on('end', function() {
            deferred.resolve(stream);
        });

        readStream.pipe(stream);

        return deferred.promise;
    } catch(e) {
        deferred.reject();

        return deferred.promise;
    }
};

var $poller = {
    id: 'file-poller',

    handlers: {},

    attach: function(component) {
        var parsed = url.parse(component.uri),
            baseDir = path.resolve(parsed.pathname);

        if (!this.handlers[baseDir]) {
            this.handlers[baseDir] = {};
        }

        var handler = this.handlers[baseDir][component.id] = {
            options: component.options,
            baseDir: path.resolve(baseDir),
            component: component,
            timeout: null
        };

        this.poll(handler);
    },

    detach: function(component) {
        var parsed = url.parse(component.uri),
            baseDir = path.resolve(parsed.pathname);

        if (!this.handlers[baseDir]) {
            return;
        }

        var handler = this.handlers[baseDir][component.id];

        clearTimeout(handler.timeout);

        delete this.handlers[baseDir][component.id];
    },

    poll: function(handler) {
        var that = this,
            backupDir = path.resolve(handler.baseDir, '.backup');

        Q.nfcall(mkdirp, backupDir).then(function() {
            return Q.nfcall(fs.readdir, handler.baseDir);
        }).then(function(files) {

            var length = 0, count = 0, deferred = Q.defer();

            files.forEach(function(file) {
                if (file[0] === '.') {
                    return;
                }

                var original = path.resolve(handler.baseDir, file),
                    destination = path.resolve(handler.baseDir, '.backup', file);

                Q.nfcall(fs.stat, original).then(function(stat) {
                    var deferred = Q.defer();

                    setTimeout(function() {
                        fs.stat(original, function(err, stat1) {
                            if (stat.size === stat1.size) {
                                length++;
                                deferred.resolve();
                            } else {
                                deferred.reject();
                            }
                        });
                    }, handler.options.initialDelay);
                    return deferred.promise;
                }).then(function() {
                    return Q.nfcall(fs.rename, original, destination);
                }).then(function() {
                    that.process(handler, new File(destination), {
                        'file-name': file,
                        'file-path': handler.baseDir
                    });
                    count++;

                    if (count >= length) {
                        deferred.resolve(count);
                    }
                });
            });

            if (length === 0) {
                return 0;
            }

            return deferred.promise;
        }).then(function(length) {
            // FIXME code below should be ONLY invoked after all files processes done
            handler.timeout = setTimeout(function() {
                that.poll(handler);
            }, handler.options.delay);
        });

    },

    process: function(handler, body, headers) {
        var exchange = new Exchange();
        exchange.header(headers);
        exchange.body = body;
        handler.component.context.send(Channel.IN, handler.component, exchange, this);
    }
};

module.exports = {
    options: {
        initialDelay: 100,
        delay: 1000
    },

    start: function() {
        this.constructor.prototype.start.apply(this, arguments);

        var uri = this.uri.substr(this.uri.indexOf(':') + 1);

        if (this.type === 'source') {
            this.getPoller().attach(this);
        }
    },

    stop: function() {
        var uri = this.uri.substr(this.uri.indexOf(':') + 1);

        if (this.type === 'source') {
            this.getPoller().detach(this);
        }

        this.constructor.prototype.stop.apply(this, arguments);
    },

    getPoller: function() {
        return $poller;
    },

    process: function(exchange) {
        if (this.type === 'source') {
            return exchange;
        } else {
            return this.processOut(exchange);
        }
    },

    prepareDir: function(pathname) {
        return Q.nfcall(mkdirp, pathname);
    },

    processOut: function(exchange) {
        var deferred = Q.defer(),
            that = this;
        var body = exchange.body;

        var fileName = exchange.header('file-name');
        if (!fileName) {
            fileName = exchange.id.replace('/', '-');
            exchange.header('file-name', fileName);
        }

        var parsed = url.parse(this.uri);
        var filePath = path.resolve(parsed.pathname, fileName);

        exchange.header('file-path', filePath);

        this.prepareDir(parsed.pathname).then(function() {
            if (typeof body.pipe === 'function') {
                var writeStream = fs.createWriteStream(filePath);
                body.pipe(writeStream).then(function() {
                    deferred.resolve(exchange);
                });
            } else {
                fs.writeFile(filePath, body, function(err) {
                    if (err) {
                        console.error('Error <' + error + '>', error.stack);
                        deferred.reject(err);
                    } else {
                        deferred.resolve(exchange);
                    }
                });
            }
        });

        return deferred.promise;
    }
};
var argv = require('optimist').argv,
    path = require('path'),
    fs = require('fs'),
    cluster = require('cluster'),
    logger = require('./logger'),
    clc = require('cli-color'),
    Q = require('q'),
    Table = require('easy-table'),
    version = require('../package').version;


var createWorker = function() {
    var worker = cluster.fork();

    worker.on('message', function(message) {
        var i;

        if (message.method) {
            if (message.reply) {
                message.replyLength = Object.keys(cluster.workers).length;
                cluster.workers[message.origin].send(message);
                return;
            }

            if (message.method === 'shutdown') {
                for(i in cluster.workers) {
                    cluster.workers[i].send({
                        method: 'stop'
                    });
                }
                process.exit();
                return;
            }

            message.origin = worker.id;
            for(i in cluster.workers) {
                message.destination = i;
                cluster.workers[i].send(message);
            }
        }

    });
};

var doRun = function(manifest) {
    if (cluster.isMaster) {
        logger.p(
            clc.blueBright('::::::::::::::::::::::::::::::::::') +
            clc.bold.yellow(' yesbee v' + version + ' ') +
            clc.blueBright('::::::::::::::::::::::::::::::::::')
        );

        // Fork workers.
        for (var i = 0; i < manifest.worker; i++) {
            createWorker();
        }

        cluster.on('exit', function(worker, code, signal) {
            if (worker.suicide !== true) {
                createWorker();
            }
        });
    } else {
        // populate manifest.json file and merge to props
        var container = require('../lib/container')(manifest);
        container.start();

        var replies = {};

        process.on('message', function(message) {
            if (message.method) {
                var q = Q;
                if (message.reply) {
                    replies[message.id] = replies[message.id] || [];
                    replies[message.id].push(message);
                    if (replies[message.id].length >= message.replyLength) {
                        container.reply({
                            id: message.id,
                            reply: replies[message.id]
                        });
                        delete replies[message.id];
                    }
                    return;
                }
                q(container[message.method].apply(container, message.arguments)).then(function(result) {
                    message.reply = true;
                    message.result = result;
                    try {
                        process.send(message);
                    } catch(e) {
                        logger.e('Error send reply', e);
                    }
                });

            }
        });
    }
};

var setValue = function(o, k, v) {
    eval('o.' + k + ' = v;');
};

module.exports = function() {
    "use strict";

    var ENV = process.env.YESBEE_ENV || 'development';

    var manifestFile = path.resolve(argv.c || './manifest.json'),
        manifest = {};

    if (fs.existsSync(manifestFile)) {
        try {
            manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));

            if (manifest.env && manifest.env[ENV]) {
                for(var i in manifest.env[ENV]) {
                    manifest[i] = manifest.env[ENV][i];
                }
            }
        } catch(e) {
            logger.e('Cannot read manifest file', e.message);
            return;
        }
    }


    if (argv.p) {
        if (typeof argv.p === 'string') {
            argv.p = [argv.p];
        }
        argv.p.forEach(function(p) {
            p = p.split('=');
            var key = p[0];
            var value = p.slice(1).join('=');
            setValue(manifest, key, value);
        });
    }

    manifest.container = path.resolve(manifest.container || '.');

    if (manifest.worker) {
        if (manifest.worker === 'auto') {
            manifest.worker = require('os').cpus().length;
        }
    } else {
        manifest.worker = 1;
    }

    if (argv.h) {
        logger.p('yesbee v' + version);
        logger.p('Usage: yesbee [-h] [-c filename] [-p directives] [-s signal]');
        logger.p('\nOptions');
        logger.p(Table.printObj({
            '  -h help': 'show this help',
            '  -c configuration file': 'set configuration file (default: ./manifest.json)',
            '  -p properties': 'set properties out of configuration file',
            '  -s signal': 'send signal to a master process: stop, restart'
        }));

        logger.p('Properties');
        logger.p(Table.printObj({
            '  container': 'container which yesbee will run at',
            '  worker': 'number of worker will be activated',
            '  autostart': 'services that autostarted',
            '  dependencies': 'custom scope dependencies (loaded before container scope)'
        }));
    } else if (argv.s) {
        logger.e('Cannot send signal yet, unimplemented at this point of version.');
    } else {
        doRun(manifest);
    }
};
'use strict';

const spawn = require('child_process').spawn;
const streamUtil = require('../utils/stream');
const EventEmitter = require('events');
const JSONStream = require('JSONStream');

var persistentProcessors = {};

function PersistentProcessor (options) {
  EventEmitter.call(this);
  // this.options = options;

  var jsonStream = JSONStream.parse();
  jsonStream.on('data', function(data) {
    this.emit(data.id, data);
  }.bind(this));

  this.process = spawn(options.cmd[0], options.cmd.slice(1));
  this.process[options.output].pipe(jsonStream);
}

PersistentProcessor.prototype = EventEmitter.prototype;
PersistentProcessor.prototype.send = function(message) {
  this.process.stdin.write(message.serialize());
};

PersistentProcessor.get = function(options) {
  var key = options.cmd.join('|');
  if (!persistentProcessors[key]) {
    persistentProcessors[key] = new PersistentProcessor(options);
  }

  return persistentProcessors[key];
};

function delegatePersistent(message, options) {
  return new Promise(function(resolve, reject) {
    var pproc = PersistentProcessor.get(options);
    pproc.on(message.id, function(result) {
      message.merge(result);
      if (result.error) {
        return reject();
      } else {
        return resolve();
      }
    });
    pproc.send(message);
  });
}

module.exports = function(component) {

  component.createSource = function (uri) {
    throw new Error('Component: log cannot act as source');
  };

  component.process = function * (message, options) {
    var cmd = options.cmd || message.uri.split(':', 2)[1].split(' ');
    var output = options.output || 'stdout';

    var streaming = options.streaming || false;
    var persistent = options.persistent || false;

    if (persistent) {
      streaming = false;
      yield delegatePersistent(message, {
        cmd: cmd,
        output: output,
      });
    } else {
      var proc = spawn(cmd[0], cmd.slice(1));
      if (streaming) {
        proc.stdin.write(message.body);
        proc.stdin.end();
        message.body = proc[output];
      } else {
        yield new Promise(function(resolve, reject) {
          var chunks = [];
          proc[output].on('data', function(chunk) {
            chunks.push(chunk);
          });

          proc.on('close', function(code) {
            if (code !== 0) {
              return reject(new Error('Error pipe to ' + message.uri));
            }

            message.body = Buffer.concat(chunks);
            resolve();
          });

          proc.stdin.write(message.body);
          proc.stdin.end();
        });
      }
    }
  };
};
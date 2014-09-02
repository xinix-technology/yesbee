var EventEmitter = require('events').EventEmitter,
    util = require('util');

var Channel = function() {

};

util.inherits(Channel, EventEmitter);

Channel.instance = new Channel();

Channel.IN = 'IN';
Channel.OUT = 'OUT';
Channel.PRODUCER = 'PRODUCER';
Channel.CONSUMER = 'CONSUMER';
Channel.CALLBACK = 'CALLBACK';
Channel.SINK = 'SINK';

Channel.create = function() {
    return Channel.instance;
};

module.exports = Channel;
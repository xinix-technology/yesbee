'use strict';

const url = require('url');
const http = require('http');
const bono = require('bono');
const _ = require('lodash');
const request = require('superagent');

module.exports = function(component) {
  var servers = {};

  function rewrite(server) {
    _.forEach(server.app.router.routes, function(methodRoutes) {
      methodRoutes.splice(0, methodRoutes.length);
    });

    _.forEach(_.sortByOrder(Object.keys(server.routes), function(v) {
      return v;
    }, 'desc'), function(k) {
      server.app.routeAny(server.routes[k].pattern, server.routes[k].handler, ['rest']);
    });
  }

  component.process = function *(message) {
    var resp = yield request(message.uri);

    _.forEach(resp.headers, function(v, k) {
      message.headers['http-' + k] = v;
    });
    message.body = resp.body;
  };

  component.start = function *(source) {
    var parsed = url.parse(source.uri);
    var port = parsed.port || 80;
    var serverId = parsed.hostname + ':' + port;

    var server = servers[serverId];
    if (!server) {
      var app = bono();
      var callback = app.callback();

      servers[serverId] = server = {};

      Object.defineProperties(server, {
        daemon: {enumerable: false, writable: false, configurable: false, value: http.createServer(callback), },
        routes: {enumerable: false, writable: false, configurable: false, value: {}, },
        app: {enumerable: false, writable: false, configurable: false, value: app, },
      });

      yield new Promise(function(resolve, reject) {
        server.daemon.listen(port, parsed.hostname, function(err) {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }

    if (server.routes[parsed.pathname]) {
      throw new Error('Http route ' +  parsed.pathname + ' already bound for ' + source.uri);
    }

    var route = server.routes[parsed.pathname] = {
      pattern: new RegExp('^' + parsed.pathname + '(.*)$'),
      handler: function *() {
        var message = component.createMessage(source.uri, 'inOut');
        message.headers['http-request-method'] = this.method;
        message.headers['http-request-uri'] = this.url;
        _.forEach(this.headers, function(v, k) {
          message.headers['http-' + k] = v;
        });
        message.body = this.req;

        var result = yield component.request(message);
        if (this.req === result.body) {
          this.body = null;
        } else {
          this.body = result.body;
        }
      },
    };
    rewrite(server);
  };

  component.stop = function *(source) {
    var parsed = url.parse(source.uri);
    var port = parsed.port || 80;
    var serverId = parsed.hostname + ':' + port;

    var server = servers[serverId];
    if (!server) {
      return;
    }

    delete server.routes[parsed.pathname];
    if (Object.keys(server.routes).length === 0) {
      yield new Promise(function(resolve, reject) {
        server.daemon.close(function(err) {
          if (err) return reject(err);
          resolve();
        });
      });
      delete servers[serverId];
    } else {
      rewrite(server);
    }
  };
};
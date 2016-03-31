'use strict';

const path = require('path');

module.exports = function(env) {
  env = env || process.env;

  var config = {
    env: env.YESBEE_ENV || env.ENV || 'development',
  };

  if (env.YESBEE_HOST) {
    config.host = env.YESBEE_HOST;
  } else {
    config.socketPath = env.YESBEE_SOCKET_PATH || path.resolve('./yesbee.sock');
  }

  return config;
};
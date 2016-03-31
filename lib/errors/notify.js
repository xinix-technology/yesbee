function Notify(message) {
  this.message = message;
  Error.captureStackTrace(this, this.constructor);
}

require('util').inherits(Notify, Error);

module.exports = Notify;
// for nodejs pre 0.12 support
var pgPromiseOpts = typeof Promise !== 'undefined' ? {} : {
  promiseLib: require('when')
};

module.exports = require('pg-promise')(pgPromiseOpts);

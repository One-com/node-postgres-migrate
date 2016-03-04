var pgPromiseOpts = {
    poolSize: 0 //disable connection pooling.
}

// for nodejs pre 0.12 support
if (typeof Promise === 'undefined') {
    pgPromiseOpts.promiseLib = require('when');
}

module.exports = require('pg-promise')(pgPromiseOpts);

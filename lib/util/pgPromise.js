var pgPromiseOpts = {};

// for nodejs pre 0.12 support
if (typeof Promise === 'undefined') {
    pgPromiseOpts.promiseLib = require('when');
}

var pgp = require('pg-promise')(pgPromiseOpts);

pgp.pg.defaults.poolSize = 0;

module.exports = pgp;

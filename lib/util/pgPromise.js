var pgPromiseOpts = {};

// for nodejs pre 0.12 support
if (typeof Promise === 'undefined') {
    pgPromiseOpts.promiseLib = require('when');
}

var pgp;

function initialize () {
    pgp = require('pg-promise')(pgPromiseOpts);

    pgp.initialDefaultPoolSize = pgp.pg.defaults.poolSize;
    pgp.restoreInitialPoolSize = function () {
        pgp.pg.defaults.poolSize = pgp.initialDefaultPoolSize;
    };

    pgp.pg.defaults.poolSize = 0;
    pgp.reinitialize = function () {
        pgp.restoreInitialPoolSize();
        initialize();
    };
}

initialize();

module.exports = pgp;

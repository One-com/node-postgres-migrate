var pgp = require('pg-promise')({});

module.exports = function findAppliedMigrations (options) {
    var db = pgp(options.conString);

    return db.query('SELECT id, name FROM migrations');
};

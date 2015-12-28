var pgp = require('pg-promise')({});

module.exports = function (options) {
    var db = pgp(options.conString);

    var sql = [
        'CREATE TABLE IF NOT EXISTS migrations ',
        '( id integer primary key, name character varying NOT NULL );'
    ].join(' ');

    options.reporter('Creating migrations table, if it does not exist.');
    return db.query(sql);
};

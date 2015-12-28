var sequence = require('when/sequence');
var pgp = require('./util/pgPromise');

// for nodejs pre 0.12 support
if (typeof Promise === 'undefined') {
  var Promise = require('when').Promise;
}

module.exports = function executeMigrations(options, migrations) {
    return Promise.resolve().then(function () {
        var db = pgp(options.conString);
        var reporter = options.reporter;

        return sequence(migrations.map(function (migration) {
            var prettyName = migration.name
                .replace(/\.sql$/, '')
                .replace(/^\d+-/, '')
                .replace(/-/g, ' ');
            return function () {
                return db.tx(function (t) {
                    return t.batch([
                        t.none(migration.sql),
                        t.none(
                            'INSERT INTO migrations (id, name) VALUES ($1, $2)',
                            [ migration.id, migration.name ]
                        )
                    ]);
                }).then(function (result) {
                    reporter('✔', prettyName);
                    return result;
                }).catch(function (transactionError) {
                    reporter('✗', prettyName);
                    if (Array.isArray(transactionError)) {
                        transactionError.forEach(function (result) {
                            if (!result.success) {
                                var newErr = result.result;
                                newErr.message += ' in: ' + migration.name;
                                throw newErr;
                            }
                        });
                    }
                    throw transactionError;
                });
            };
        }));
    });
};

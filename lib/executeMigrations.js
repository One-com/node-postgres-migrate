var Promise = require('when').Promise;
var sequence = require('when/sequence');
var pgp = require('pg-promise')({});

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
                var transaction = db.tx(function (t) {
                    return t.batch([
                        t.none(migration.sql),
                        t.none(
                            'INSERT INTO migrations (id, name) VALUES ($1, $2)',
                            [ migration.id, migration.name ]
                        )
                    ]);
                });

                transaction.then(function () {
                    reporter('✔', prettyName);
                }, function (err) {
                    reporter('✗', prettyName);
                    throw err;
                });

                return transaction.catch(function (transactionError) {
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

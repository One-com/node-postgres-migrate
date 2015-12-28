var databaseUpToDate = require('./lib/databaseUpToDate');
var attemptToGetLock = require('./lib/attemptToGetLock');
var createMigrationTable = require('./lib/createMigrationTable');
var findAppliedMigrations = require('./lib/findAppliedMigrations');
var findMigrations = require('./lib/findMigrations');
var loadMigrations = require('./lib/loadMigrations');
var executeMigrations = require('./lib/executeMigrations');
var broadcastLockRelease = require('./lib/broadcastLockRelease');
var awaitLockRelease = require('./lib/awaitLockRelease');

module.exports = function migrate (input) {
    options = options || {};

    var reporter = input.reporter || function reporter () {
        return console.log.apply(console, arguments);
    };

    var options = {
        conString: input.conString,
        migrationsDir: input.migrationsDir,
        reporter: reporter
    };

    return Promise.resolve().then(function () {
        if (!options.conString) {
            throw new Error('You must provide options.conString');
        }
        if (!options.migrationsDir) {
            throw new Error('You must provide options.migrationsDir');
        }

        return databaseUpToDate(options).then(function (databaseUpToDate) {
            if (databaseUpToDate) {
                return;
            }
            return attemptToGetLock(options).then(function (releaseLock) {
                return createMigrationTable(options)
                    .then(function () { return findAppliedMigrations(options); })
                    .then(function (applied) {
                        return findMigrations(options).then(function (migrations) {
                            return migrations.filter(function (migration) {
                                return applied.indexOf(migration.name) === -1;
                            });
                        });
                    })
                    .then(function (migrations) {
                        return loadMigrations(options, migrations);
                    })
                    .then(function (migrations) {
                        return executeMigrations(options, migrations);
                    })
                    .then(function () { return releaseLock(); })
                    .then(function () { return broadcastLockRelease(options); });
            }).catch(function (err) {
                if (err.code === 'LOCK_ALREADY_TAKEN') {
                    return awaitLockRelease(options);
                }
                throw err;
            });
        });
    });
};

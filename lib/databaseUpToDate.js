var findMigrations = require('./findMigrations');
var findAppliedMigrations = require('./findAppliedMigrations');

function findLatestMigration (migrations) {
    return migrations.reduce(function (last, next) {
        if (last.id > next.id) {
            return last;
        }
        return next;
    }, { id: 0 });
}

function latestMigrationFileSystem(options) {
    return findMigrations(options).then(findLatestMigration);
}

function latestMigrationDatabase (options) {
    return findAppliedMigrations(options).then(findLatestMigration);
}

module.exports = function databaseUpToDate (options) {
    options.reporter('Checking if database is up to date');
    return latestMigrationDatabase(options).then(function (latestDatabase) {
        return latestMigrationFileSystem(options).then(function (latest) {
            if (
                latest.id === latestDatabase.id &&
                latest.name === latestDatabase.name
            ) {
                options.reporter('Database is up to date.');
                return true;
            }
            options.reporter('Database is NOT up to date.');
            return false;
        });
    }).catch(function (err) {
        if (err.message === 'relation "migrations" does not exist') {
            return false;
        }
        throw err;
    });
};

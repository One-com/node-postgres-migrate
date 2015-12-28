require('mocha-docker-postgres');
var expect = require('unexpected');
var pgp = require('../../lib/util/pgPromise');
var createMigrationTable = require('../../lib/createMigrationTable');

describe('lib/createMigrationTable @postgres', function () {
    var options = {};
    var db;

    var hasTableNamed = function (tableName) {
        return db.query([
            'SELECT tablename FROM pg_tables',
            'WHERE schemaname = $1',
            'AND tablename = $2'
        ].join(' '), [ 'public', tableName ]).then(function (result) {
            if (result.length === 1) {
                return true;
            }
            throw new Error('no such table');
        });
    };

    before(function () {
        return this.dockerPostgres();
    });

    before(function () {
        db = pgp(this.conString);

        options.conString = this.conString;
        options.reporter = console.log.bind(console);
        options.reporter = function () {};
    });

    it('should create migration table', function () {
        return expect(hasTableNamed('migrations'), 'to be rejected')
            .then(function () {
                return expect(createMigrationTable(options), 'to be fulfilled');
            }).then(function () {
                return expect(hasTableNamed('migrations'), 'to be fulfilled');
            });
    });

    it('should not create migration table', function () {
        return expect(hasTableNamed('migrations'), 'to be fulfilled')
            .then(function () {
                return expect(createMigrationTable(options), 'to be fulfilled');
            });
    });
});

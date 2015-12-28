require('mocha-docker-postgres');
var expect = require('unexpected')
    .clone()
    .use(require('unexpected-fs'));
var createMigrationTable = require('../../lib/createMigrationTable');
var executeMigrations = require('../../lib/executeMigrations');
var databaseUpToDate = require('../../lib/databaseUpToDate');

function extend(dst) {
    return Array.prototype.slice.call(arguments, 1).reduce(function (dst, obj) {
        Object.keys(obj).forEach(function (key) {
            if (obj.hasOwnProperty(key)) {
                dst[key] = obj[key];
            }
        });
        return dst;
    }, dst);
}

describe('lib/databaseUpToDate @postgres', function () {
    var options = {};
    beforeEach(function () {
        return this.dockerPostgres();
    });
    beforeEach(function () {
        options.conString = this.conString;
        options.reporter = console.log.bind(console);
        options.reporter = function () {};
        options.migrationsDir = '';
    });

    it('should resolve true when the database is up to date', function () {
        var migrations = [
            { id: 1, name: '001-create-users-table.sql', sql: 'NOTIFY foo' },
            { id: 2, name: '002-add-password.sql', sql: 'NOTIFY bar' }
        ];
        options.migrationsDir = '/fixtures/migrations';
        return expect(
            createMigrationTable(options),
            'to be fulfilled'
        ).then(function () {
            return expect(
                executeMigrations(options, migrations),
                'to be fulfilled'
            );
        }).then(function () {
            return expect(
                [options, migrations],
                'with fs mocked out',
                { '/fixtures/migrations': {
                    '001-create-users-table.sql': 'SELECT now();',
                    '002-add-password.sql': 'SELECT now();'
                } },
                'when passed as parameters to',
                databaseUpToDate,
                'to be fulfilled with',
                true
            );
        });
    });
    it('should resolve false when the database is not up to date', function () {
        var migrations = [
            { id: 1, name: '001-create-users-table.sql', sql: 'NOTIFY foo' }
        ];
        options.migrationsDir = '/fixtures/migrations';
        return expect(
            createMigrationTable(options),
            'to be fulfilled'
        ).then(function () {
            return expect(
                executeMigrations(options, migrations),
                'to be fulfilled'
            );
        }).then(function () {
            return expect(
                [options, migrations],
                'with fs mocked out',
                { '/fixtures/migrations': {
                    '001-create-users-table.sql': 'SELECT now();',
                    '002-add-password.sql': 'SELECT now();'
                } },
                'when passed as parameters to',
                databaseUpToDate,
                'to be fulfilled with',
                false
            );
        });
    });
    it('should resolve false when the migration table does not exist', function () {
        var promise = databaseUpToDate(options, []);
        return expect(promise, 'to be fulfilled with', false);
    });
    it('should reject if database is not available', function () {
        var opts = extend({}, options);
        opts.conString = 'postgres://nosuchdatabase:34243/foo';

        var promise = databaseUpToDate(opts, []);
        return expect(promise, 'to be rejected with', /ENOTFOUND/);
    });
});

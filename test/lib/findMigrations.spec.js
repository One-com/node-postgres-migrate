var expect = require('unexpected')
    .clone()
    .use(require('unexpected-fs'));
var findMigrations = require('../../lib/findMigrations');

describe('lib/findMigrations', function () {
    var options = {};
    before(function () {
        options.migrationsDir = '/fixtures/migrations';
        //options.reporter = console.log.bind(console);
        options.reporter = function () {};
    });
    it('should find migrations from the file system', function () {
        return expect(options, 'with fs mocked out', {
            '/fixtures/migrations': {
                '001-create-users-table.sql': 'some sql;',
                '002-add-password-to-users-table.sql': 'some other sql;'
            }
        }, 'when passed as parameter to', findMigrations, 'to be fulfilled')
            .then(function (result) {
                return expect(result, 'to exhaustively satisfy', [
                    {
                        id: 1,
                        name: '001-create-users-table.sql'
                    },
                    {
                        id: 2,
                        name: '002-add-password-to-users-table.sql'
                    }
                ]);
            });
    });
    it('should reject migrations with 0 as id', function () {
        return expect(options, 'with fs mocked out', {
            '/fixtures/migrations': {
                '000-create-foo-table.sql': 'asdfasfd',
                '001-create-users-table.sql': 'some sql;',
                '002-add-password-to-users-table.sql': 'some other sql;'
            }
        }, 'when passed as parameter to', findMigrations, 'to be rejected')
            .then(function (err) {
                return expect(err, 'to satisfy', {
                    'message': /invalid migration name: .000-/
                });
            });
    });
    it('should reject migrations with no id', function () {
        return expect(options, 'with fs mocked out', {
            '/fixtures/migrations': {
                'create-foo-table.sql': 'asdfasfd',
                '001-create-users-table.sql': 'some sql;',
                '002-add-password-to-users-table.sql': 'some other sql;'
            }
        }, 'when passed as parameter to', findMigrations, 'to be rejected')
            .then(function (err) {
                return expect(err, 'to satisfy', {
                    'message': /invalid migration name: .create-foo-table/
                });
            });
    });
});

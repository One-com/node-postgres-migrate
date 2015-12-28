var expect = require('unexpected')
    .clone()
    .use(require('unexpected-fs'));
var loadMigrations = require('../../lib/loadMigrations');

describe('lib/loadMigrations', function () {
    var options = {};
    before(function () {
        options.reporter = function () {};
        options.reporter = console.log.bind(console);
    });

    it('should load migrations from the file system', function () {
        var migrations = [
                {
                    id: 1,
                    name: '001-create-users-table.sql'
                },
                {
                    id: 2,
                    name: '002-add-password-to-users-table.sql'
                }
        ];
        options.migrationsDir = '/fixtures/migrations/';
        return expect([options, migrations], 'with fs mocked out', {
            '/fixtures/migrations': {
                '001-create-users-table.sql': 'some sql;',
                '002-add-password-to-users-table.sql': 'some other sql;'
            }
        }, 'when passed as parameters to', loadMigrations, 'to be fulfilled')
            .then(function (result) {
                return expect(result, 'to exhaustively satisfy', [
                    {
                        id: 1,
                        name: '001-create-users-table.sql',
                        sql: 'some sql;'
                    },
                    {
                        id: 2,
                        name: '002-add-password-to-users-table.sql',
                        sql: 'some other sql;'
                    }
                ]);
            });
    });
});

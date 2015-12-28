require('mocha-docker-postgres');
var pg = require('pg');
var expect = require('unexpected');
var createMigrationTable = require('../../lib/createMigrationTable');
var executeMigrations = require('../../lib/executeMigrations');
var findAppliedMigrations = require('../../lib/findAppliedMigrations');

describe('lib/findAppliedMigrations @postgres', function () {
    var options = {};
    before(function () {
        return this.dockerPostgres();
    });
    before(function () {
        options.conString = this.conString;
        //options.reporter = console.log.bind(console);
        options.reporter = function () {};
    });
    before(function () {
        var migrations = [
            {
                id: 1,
                name: '001-create-users-table.sql',
                sql: 'CREATE TABLE users (\
                    id serial primary key,\
                    username character varying NOT NULL UNIQUE\
                );'
            },
            {
                id: 2,
                name: '002-add-password-to-users-table.sql',
                sql: 'ALTER TABLE users ADD COLUMN password character varying;'
            }
        ];
        return createMigrationTable(options).then(function () {
            return executeMigrations(options, migrations);
        });
    });
    it('should find migrations from the database', function () {
        return expect(findAppliedMigrations(options), 'to be fulfilled')
            .then(function (result) {
                return expect(result, 'to satisfy', [
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
});

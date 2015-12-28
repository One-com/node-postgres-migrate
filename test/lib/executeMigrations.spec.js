require('mocha-docker-postgres');
var pgp = require('../../lib/util/pgPromise');
var expect = require('unexpected');
var createMigrationTable = require('../../lib/createMigrationTable');
var executeMigrations = require('../../lib/executeMigrations');

describe('lib/executeMigrations @postgres', function () {
    var options = {};
    var db;
    beforeEach(function () {
        return this.dockerPostgres();
    });
    beforeEach(function () {
        options.conString = this.conString;
        options.reporter = function () {};
        //options.reporter = console.log.bind(console);

        db = pgp(this.conString);
    });
    beforeEach(function () {
        return createMigrationTable(options);
    });
    it('should run migrations on empty database', function () {
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
        return expect(executeMigrations(options, migrations), 'to be fulfilled')
            .then(function () {
                return db.query('SELECT * FROM migrations');
            })
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
    it('should only run unapplied migrations', function () {
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
        return expect(
            executeMigrations(options, [ migrations[0] ]),
            'to be fulfilled'
        )
            .then(function () {
                return db.query('SELECT * FROM migrations');
            })
            .then(function (result) {
                return expect(result, 'to satisfy', [
                    {
                        id: 1,
                        name: '001-create-users-table.sql'
                    }
                ]);
            })
            .then(function () {
                return expect(
                    executeMigrations(options, [ migrations[1] ]),
                    'to be fulfilled'
                );
            })
            .then(function () {
                return db.query('SELECT * FROM migrations');
            })
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
    it('should fail if two migrations have the same id', function () {
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
            },
            {
                id: 2,
                name: '002-add-email-to-users-table.sql',
                sql: 'ALTER TABLE users ADD COLUMN email character varying;'
            }
        ];
        return expect(executeMigrations(options, migrations), 'to be rejected')
            .then(function (err) {
                return expect(err, 'to satisfy', {
                    message: /duplicate key(.*)002-add-email-(.*).sql$/
                });
            });
    });
});

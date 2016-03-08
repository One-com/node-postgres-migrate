require('mocha-docker-postgres');
var expect = require('unexpected')
    .clone()
    .use(require('unexpected-fs'));
var migrate = require('../');
var pgp = require('../lib/util/pgPromise');

function enableConnectionPooling() {
    pgp.restoreInitialPoolSize();
}

function disableConnectionPoolingAndCleanup() {
    pgp.pg.end();
    pgp.reinitialize();
}

enableConnectionPooling();

// for nodejs pre 0.12 support
if (typeof Promise === 'undefined') {
  var Promise = require('when').Promise;
}

function extend(dest) {
    var rest = Array.prototype.slice.call(arguments, 1);
    return rest.reduce(function (dest, source) {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                dest[prop] = source[prop];
            }
        }
        return dest;
    }, dest);
}

describe('migrate @postgres', function () {
    var options = {};

    var migrationsDir = {
        '001-create-users-table.sql': [
            'CREATE TABLE users ( id serial primary key,',
            'username character varying NOT NULL UNIQUE );'
        ].join(' '),
        '002-add-password-to-users-table.sql': [
            'ALTER TABLE users ADD COLUMN password character varying;'
        ].join(' '),
        '003-add-password-version-to-users-table.sql': [
            'ALTER TABLE users ADD COLUMN password_version integer DEFAULT 0;'
        ].join(' '),
    }

    beforeEach(function () {
        return this.dockerPostgres();
    });
    beforeEach(function () {
        options.conString = this.conString;
        options.reporter = console.log.bind(console);
        options.reporter = function () {};
        options.migrationsDir = '/migrations';

        disableConnectionPoolingAndCleanup();
    });
    after(function () {
        disableConnectionPoolingAndCleanup();
    });

    describe('single migration process', function () {
        it('should migrate a database to the newest state', function () {
            return expect(options, 'with fs mocked out', {
                '/migrations': migrationsDir
            }, 'when passed as parameter to', migrate, 'to be fulfilled');
        });
        it('should reenable connection pooling after running', function () {
            // reset connection pooling
            enableConnectionPooling();
            return expect(pgp.pg.defaults, 'to satisfy', {
                poolSize: pgp.initialDefaultPoolSize
            }).then(function () {
                // reinitialize the pgp module as when it's first required
                pgp.reinitialize();
                return expect(pgp.pg.defaults, 'to satisfy', {
                    poolSize: 0
                }).then(function () {
                    return expect(options, 'with fs mocked out', {
                        '/migrations': migrationsDir
                    }, 'when passed as parameter to', migrate, 'to be fulfilled').then(function () {
                        return expect(pgp.pg.defaults, 'to satisfy', {
                            poolSize: pgp.initialDefaultPoolSize
                        });
                    });
                });
            });
        });
    });

    describe('multiple migration processes', function () {
        beforeEach(function () {
            // Enable connection pooling for these tests, as they require multiple
            // parallel migration processes.
            enableConnectionPooling();
        });
        it('should migrate a database to the newest state', function () {
            var enableLogging = false;
            var options1 = extend({}, options, { reporter: function () {
                if (!enableLogging) { return; }
                var args = Array.prototype.slice.call(arguments);
                return console.log.apply(console, ['1:'].concat(args));
            } });
            var options2 = extend({}, options, { reporter: function () {
                if (!enableLogging) { return; }
                var args = Array.prototype.slice.call(arguments);
                return console.log.apply(console, ['2:'].concat(args));
            } });
            var options3 = extend({}, options, { reporter: function () {
                if (!enableLogging) { return; }
                var args = Array.prototype.slice.call(arguments);
                return console.log.apply(console, ['3:'].concat(args));
            } });
            options3.reporter('sdfasdf')
            return expect(function (cb) {
                return Promise.all([
                    migrate(options1),
                    migrate(options2),
                    migrate(options3)
                ]).then(function (val) { return cb(null, val); }, cb);
            }, 'with fs mocked out', {
                '/migrations': migrationsDir
            }, 'to call the callback without error');
        });
    });

    // TODO test error cases.
});

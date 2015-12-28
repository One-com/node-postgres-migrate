require('mocha-docker-postgres');
var pg = require('pg');
var expect = require('unexpected');
var attemptToGetLock = require('../../lib/attemptToGetLock');

describe('lib/attemptToGetLock @postgres', function () {
    before(function () {
        return this.dockerPostgres();
    });
    it('should get a lock and return a method to release it', function () {
        var options = {
            conString: this.conString,
            //reporter: console.log.bind(console)
            reporter: function () {}
        };
        return expect(attemptToGetLock(options), 'to be fulfilled')
            .then(function (releaseLock) {
                return expect(releaseLock(), 'to be fulfilled');
            });
    });
    describe('lock already taken', function () {
        it('should fail getting a lock if it is already taken', function () {
            var options = {
                conString: this.conString,
                //reporter: console.log.bind(console)
                reporter: function () {}
            };

            var client = new pg.Client(this.conString);

            return expect(function (cb) {
                client.connect(function (err) {
                    if (err) { return cb(err); }
                    client.query('SELECT pg_try_advisory_lock(1)', cb);
                });
            }, 'to call the callback without error')
                .then(function () {
                    return expect(attemptToGetLock(options), 'to be rejected')
                        .then(function (err) {
                            return expect(err, 'to satisfy', {
                                message: 'lock was already taken!',
                                code: 'LOCK_ALREADY_TAKEN'
                            });
                        });
                })
                .finally(function () {
                    return expect(function (cb) {
                        client.query('SELECT pg_advisory_unlock(1)', function (err) {
                            client.end();
                            cb(err);
                        });
                    }, 'to call the callback without error');
                });
        });
    });
});

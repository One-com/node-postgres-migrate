var pgp = require('pg-promise')({});

module.exports = function attemptToGetLock (options) {
    var db = pgp(options.conString);
    var result = db.query('SELECT pg_try_advisory_lock(1) AS lock');
    return result.then(function (result) {
        if (result[0].lock) {
            options.reporter('Got lock!');
            return function releaseLock () {
                var result = db.query('SELECT pg_advisory_unlock(1)');

                result.then(function () {
                    options.reporter('Released lock!');
                }, function (err) {
                    options.reporter('Got error trying to release lock!', err);
                });

                return result;
            };
        }
        var err = new Error('lock was already taken!');
        err.code = 'LOCK_ALREADY_TAKEN';
        throw err;
    }).catch(function (err) {
        if (err.code === 'LOCK_ALREADY_TAKEN') {
            options.reporter('Lock was already taken.');
        } else {
            options.reporter('Got error while trying to get lock!', err);
        }
        throw err;
    });
};

var pgp = require('./util/pgPromise');

module.exports = function broadcastLockRelease (options) {
    var db = pgp(options.conString);
    options.reporter('Notifying listeners of lock release.');
    return db.query('NOTIFY migrationlockrelease');
};

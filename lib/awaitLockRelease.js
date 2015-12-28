var pg = require('pg');

module.exports = function awaitLockRelease (options) {
    var reporter = options.reporter || function () {};
    return new Promise(function (resolve, reject) {
        var client = new pg.Client(options.conString);
        client.connect();
        client.on('notification', function(msg) {
            if (msg.channel === 'migrationlockrelease') {
                reporter('lock was released');
                client.end();
                resolve();
            }
        });
        client.query('LISTEN migrationlockrelease', function (err) {
            if (err) {
                reporter('got error trying to listen for lock release.');
                client.end();
                reject(err);
            }
        });
    });
};

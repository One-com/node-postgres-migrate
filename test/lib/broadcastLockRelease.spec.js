require('mocha-docker-postgres');
var expect = require('unexpected');
var pg = require('pg');
var broadcastLockRelease = require('../../lib/broadcastLockRelease');

// for nodejs pre 0.12 support
if (typeof Promise === 'undefined') {
  var Promise = require('when').Promise;
}

describe('lib/broadcastLockRelease @postgres', function () {
    var options = {};
    before(function () {
        return this.dockerPostgres();
    });

    before(function () {
        options.conString = this.conString;
        options.reporter = console.log.bind(console);
        options.reporter = function () {};
    });

    it('should broadcast a lockRelease event', function () {
        var notifications = [];
        var client = new pg.Client(this.conString);

        return expect(function (cb) {
            client.connect();
            client.on('notification', function(msg) {
                notifications.push(msg);
            });
            client.query('LISTEN migrationlockrelease', cb);
        }, 'to call the callback without error')
            .then(function () {
                return expect(broadcastLockRelease(options), 'to be fulfilled');
            })
            .then(function () {
                // This is necessary to let the listener do his work
                return new Promise(function (resolve) {
                    setTimeout(resolve, 10);
                })
            })
            .then(function () {
                return expect(notifications, 'to have length', 1);
            })
            .finally(function () {
                client.end();
            });
    });
});

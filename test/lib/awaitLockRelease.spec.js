require('mocha-docker-postgres');
var expect = require('unexpected');
var broadcastLockRelease = require('../../lib/broadcastLockRelease');
var awaitLockRelease = require('../../lib/awaitLockRelease');

describe('lib/awaitLockRelease @postgres', function () {
    var options = {};
    before(function () {
        return this.dockerPostgres();
    });
    before(function () {
        options.conString = this.conString;
        options.reporter = console.log.bind(console);
        options.reporter = function () {};
    });

    it('should await a broadcasted lockRelease event', function () {
        setTimeout(function () {
            return broadcastLockRelease(options);
        }, 10);

        return expect(awaitLockRelease(options), 'to be fulfilled');
    });

    // TODO add test with setImmediate - it will fail with the current
    //      implementation. it should probably use the databaseUpToDate check.
});

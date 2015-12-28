var fs = require('fs');
var path = require('path');
var sequence = require('when/sequence');

// for nodejs pre 0.12 support
if (typeof Promise === 'undefined') {
  var Promise = require('when').Promise;
}

function readFile (path) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path, 'utf-8', function (err, content) {
            if (err) { return reject(err); }
            resolve(content);
        });
    });
}

module.exports = function loadMigrations (options, migrations) {
    var migrationsDir = options.migrationsDir.replace(/([^\/])$/, '$1/');
    return sequence(migrations.map(function (migration) {
        return function () {
            var filePath = path.resolve(migrationsDir, migration.name);
            return readFile(filePath).then(function (fileContent) {
                return {
                    id: migration.id,
                    name: migration.name,
                    sql: fileContent
                }
            });
        }
    }));
};

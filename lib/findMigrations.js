var fs = require('fs');

// for nodejs pre 0.12 support
if (typeof Promise === 'undefined') {
  var Promise = require('when').Promise;
}

function findSqlFilesInDir (dirpath) {
    var isSqlFileRegExp = /\.sql$/;
    return new Promise(function (resolve, reject) {
        fs.readdir(dirpath, function (err, files) {
            if (err) { return reject(err); }
            var sqlFiles = files.filter(function (name) {
                return isSqlFileRegExp.test(name);
            });
            resolve(sqlFiles);
        });
    });
}

function parseId (name) {
    var number = parseInt(name.replace(/^(\d+)-.+\.sql$/, '$1'));
    if (number < 1 || isNaN(number)) {
        throw new Error("invalid migration name: '" + name + "'");
    }
    return number;
}

module.exports = function findMigrations (options) {
    return Promise.resolve().then(function () {
        var migrationsDir = options.migrationsDir.replace(/([^\/])$/, '$1/');
        return findSqlFilesInDir(migrationsDir)
            .then(function (files) {
                if (files.length === 0) {
                    options.reporter('no migration files found in dir: "' + migrationsDir + '"');
                }
                return files.map(function (name) {
                    return {
                        id: parseId(name),
                        name: name
                    };
                });
            });
    });
};

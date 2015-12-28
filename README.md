# postgres-migrate


[![NPM version](https://badge.fury.io/js/postgres-migrate.svg)](https://www.npmjs.com/package/postgres-migrate)
[![Build Status](https://travis-ci.org/One-com/node-postgres-migrate.svg)](https://travis-ci.org/One-com/node-postgres-migrate)

Migrations for PostgreSQL databases utilizing advisory locks.

# Usage

Keep your migration files in a separate folder, as individual `.sql` files.

```js
var migrate = require('postgres-migrate');

migrate({
    conString: 'postgres://dbuser:dbpass@dbhost:32321/dbname',
    migrationsDir: 'path/to/migrationsDirectory',
    reporter: console.log.bind(console) // optional parameter
}).then(function () {
    // The database is ready to be used!
}).catch(function (err) {
    // Something bad happened!
});
```

You can safely start multiple workers at the same time. Only one of them will
take the lock, and upgrade the database. The others will wait for the migration
to be completed, and then resolve the promise.

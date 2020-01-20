const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./users.db')

db.serialize(() => {
db.run("CREATE TABLE accounts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, username TEXT, password TEXT)");
});
db.close();

console.log('database initialsed');


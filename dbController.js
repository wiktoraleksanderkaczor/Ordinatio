// Module requirements.
const sqlite3 = require("sqlite3");

// Database file requirements.
const db = new sqlite3.Database("./users.db");


// Function to store a user.
function storeUser(username, passwordHash, callback) {
	db.run("INSERT INTO accounts (username, password) VALUES($username, $password)", {
			$username: username,
			$password: passwordHash
		}, (err) => {
			if (err) {
				callback(err, null);
			} 
			else {
				callback(null, "User stored successfully.");
			}
		}
	);
}

// Function to retrieve all users by a username.
function getUserByName(username, callback) {
	db.get("SELECT * FROM accounts WHERE USERNAME=$name", {
			$name: username
		}, (err, row) => {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, row);
			}
		}
	);
}

module.exports.storeUser = storeUser;
module.exports.getUserByName = getUserByName;
	

	

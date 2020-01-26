// Module requirements.
const sqlite3 = require("sqlite3");

// Database file requirements.
const db = new sqlite3.Database("./users.db");


// Function to store a user.
function storeUser(username, passwordHash, role, callback) {
	db.run("INSERT INTO accounts (username, password, role) VALUES($username, $password, $role)", {
			$username: username,
			$password: passwordHash,
			$role: role
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

// Function to retrieve all users by a username.
function getUserRole(username, callback) {
	db.get("SELECT role FROM accounts WHERE USERNAME=$name", {
			$name: username
		}, (err, row) => {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, row.role);
			}
		}
	);
}

module.exports.storeUser = storeUser;
module.exports.getUserByName = getUserByName;
module.exports.getUserRole = getUserRole;

	

// Module requirements.
const sqlite3 = require("sqlite3");

// Database file requirements.
const db = new sqlite3.Database("./users.db");


// Function to store a user.
function storeUser(username, passwordHash, role, callback) {
	empty_data = JSON.stringify({});
	db.run("INSERT INTO accounts (username, password, role, data) VALUES($username, $password, $role, $data)", {
			$username: username,
			$password: passwordHash,
			$role: role,
			$data: empty_data
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

// Function to store a rota or holiday.
function storeTask(username, task, callback) {
	db.run("UPDATE accounts SET data=$input WHERE username=$name;", {
			$input: task,
			$name: username,
		}, (err) => {
			if (err) {
				callback(err, null);
			} 
			else {
				callback(null, "Rota or holiday stored successfully.");
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

// Function to retrieve "data" by a username.
function getUserData(username, callback) {
	db.get("SELECT data FROM accounts WHERE USERNAME=$name", {
			$name: username
		}, (err, row) => {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, row.data);
			}
		}
	);
}

module.exports.storeUser = storeUser;
module.exports.storeTask = storeTask;
module.exports.getUserByName = getUserByName;
module.exports.getUserRole = getUserRole;
module.exports.getUserData = getUserData;

	

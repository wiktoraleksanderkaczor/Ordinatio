// Module requirements.
const sqlite3 = require("sqlite3");
const path = require("path");

// Database file requirements.
const db = new sqlite3.Database(path.join(__dirname, "..", "database", "users.db"));


// Function to store a user.
function storeUser(username, passwordHash, role, callback) {
	empty_data = JSON.stringify({});
	db.run("INSERT INTO accounts (username, password, role, tasks, requests) VALUES($username, $password, $role, $tasks, $requests)", { 
		$username: username, 
		$password: passwordHash, 
		$role: role, 
		$tasks: empty_data, 
		$requests: empty_data 
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
	db.run("UPDATE accounts SET tasks=$input WHERE username=$name;", {
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

// Function to store a rota or holiday request.
function storeRequest(username, request, callback) {
	db.run("UPDATE accounts SET requests=$input WHERE username=$name;", {
			$input: request,
			$name: username,
		}, (err) => {
			if (err) {
				callback(err, null);
			} 
			else {
				callback(null, "Rota or holiday request stored successfully.");
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

// Function to retrieve "tasks" by a username. 
function getUserTasks(username, callback) { 
	db.get("SELECT tasks FROM accounts WHERE USERNAME=$name", { 
			$name: username 
		}, (err, row) => { 
			if (err) { 
				callback(err, null); 
			} 
			else { 
				callback(null, row.tasks); 
			} 
		} 
	); 
} 
 
// Function to retrieve "requests" by a username. 
function getUserRequests(username, callback) { 
	db.get("SELECT requests FROM accounts WHERE USERNAME=$name", { 
			$name: username
		}, (err, row) => {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, row.requests);
			}
		}
	);
}

module.exports.storeUser = storeUser;
module.exports.storeTask = storeTask;
module.exports.storeRequest = storeRequest;
module.exports.getUserByName = getUserByName;
module.exports.getUserRole = getUserRole;
module.exports.getUserTasks = getUserTasks; 
module.exports.getUserRequests = getUserRequests;
	

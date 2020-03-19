// Module requirements.
const sqlite3 = require("sqlite3");
const path = require("path");
const moment = require("moment");

// Database file requirements.
const dbPath = path.join(__dirname, "..", "database", "users.db");
const db = new sqlite3.Database(dbPath);


// Function to initialise the database 
function initialise() { 
	db.serialize(() => { 
		db.run("CREATE TABLE accounts(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, firstName TEXT, surname TEXT, jobTitle, username TEXT, password TEXT, role TEXT)");
		db.run("CREATE TABLE requests(requestId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employeeId INTEGER, type TEXT, dateTimeSubmitted TEXT, dateStart TEXT, dateEnd TEXT, timeStart TEXT, timeEnd TEXT)");
		db.run("CREATE TABLE shifts(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employeeId INTEGER, dateStart TEXT, dateEnd TEXT, timeStart TEXT, timeEnd TEXT)");
		db.run("CREATE TABLE holidays(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employeeId INTEGER, dateStart TEXT, dateEnd TEXT)");
		db.run("CREATE TABLE messages(messageId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, dateTimeSubmitted TEXT, body TEXT, senderId INTEGER, recipientId INTEGER)");
	});
}

// Function to store a user.
function storeUser(firstName, surname, jobTitle, email, passwordHash, role, callback) {
	db.run("INSERT INTO accounts (firstName, surname, jobTitle, username, password, role) VALUES($firstName, $surname, $jobTitle, $username, $password, $role)", { 
		$firstName: firstName,
		$surname: surname,
		$jobTitle: jobTitle,
		$username: email,
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

//function to delete a user from the database by their id
function deleteUser(id, callback) {
	db.run("DELETE FROM accounts WHERE id=$id", {
		$id:id
	}, (err) => {
		if(err) {
			callback(err);
		}
		else {
			callback("User " + id + " deleted from the database.");
		}
	});
}

//function to store a message in the messages table
function storeMessage(senderId, recipientId, dateTimeSubmitted, body, callback) {
	db.run("INSERT INTO messages (senderId, recipientId, dateTimeSubmitted, body) VALUES($senderId, $recipientId, $dateTimeSubmitted, $body)", {
		$senderId: senderId,
		$recipientId: recipientId,
		$dateTimeSubmitted: dateTimeSubmitted,
		$body: body
	}, (err) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, "New message for user " + recipientId + " stored.");
		}
	});
}

//function to retrieve a message by its message id
function getMessage(messageId, callback) {
	db.get("SELECT * FROM messages INNER JOIN accounts ON messages.senderId=accounts.id WHERE messageId=$messageId", {
		$messageId: messageId
	}, (err, row) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, row);
		}
	});
}

//function to retrieve all of a users messages by their employee id
function getUserMessages(employeeId, callback) {
	db.all("SELECT * FROM messages INNER JOIN accounts ON messages.senderId=accounts.id WHERE recipientId=$employeeId ORDER BY messages.messageId DESC", {
		$employeeId: employeeId
	}, (err, rows) => {
		if(err) {
			console.log(err);
			callback(err, null);
		}
		else {
			callback(null, rows);
		}
	});
}

//function to retrieve a user's sent messages by their employee id
function getUserSentMessages(senderId, callback) {
	db.all("SELECT * FROM messages INNER JOIN accounts where messages.recipientId=accounts.id WHERE senderId=$senderId", {
		$senderId: senderId
	}, (err, rows) => {
		if (err) {
			callback(err, null);
		}
		else {
			callback(null, rows);
		}
	});
}

//function to delete a specific message
function deleteMessage(messageId, callback) {
	db.run("DELETE * FROM messages WHERE messageId=$messageId", {
		$messageId: messageId
	}, (err) => {
		if(err) {
			callback(err, null);
		} else {
			callback(null, "Message " + messageId + " deleted.");
		}
	});
}

//function to delete all of a user's messages
function deleteAllUserMessages(employeeId, callback) {
	db.run("DELETE * FROM messages WHERE recipientId=$employeeId", {
		$employeeId: employeeId
	}, (err) => {
		if(err) {
			callback(err, null);
		} else {
			callback(null, "User id " + employeeId +  "'s messages deleted");
		}
	});
}

//function to delete all of a user's sent messages
function deleteAllUserSentMessages(employeeId, callback) {
	db.run("DELETE * FROM messages WHERE senderId=$employeeId", {
		$employeeId:employeeId
	}, (err) => {
		if(err) {
			callback(err, null);
		} else {
			callback(null, "User id " + employeeId + "'s sent messages deleted.");
		}
	});
}

// Function to store a request in database
function storeRequest(employeeId, type, dateTimeSubmitted, dateStart, dateEnd, timeStart, timeEnd, callback) {
	db.run("INSERT INTO requests (employeeId, type, dateTimeSubmitted, dateStart, dateEnd, timeStart, timeEnd) VALUES($employeeId, $type, $dateTimeSubmitted, $dateStart, $dateEnd, $timeStart, $timeEnd)", {
			$employeeId: employeeId,
			$type: type,
			$dateTimeSubmitted: dateTimeSubmitted,
			$dateStart: dateStart,
			$dateEnd: dateEnd,
			$timeStart: timeStart,
			$timeEnd: timeEnd
		}, (err) => {
			if (err) {
				callback(err, null);
			} 
			else {
				callback(null, "New request submitted.");
			}
		}
	);
}

//Function to cancel (delete) a request from the database
function deleteRequest(requestId, callback) {
	db.run("DELETE FROM requests WHERE requestId=$requestId", {
		$requestId:requestId
	}, (err) => {
		if(err) {
			callback(err);
		}
		else {
			callback("Request " + requestId +" cancelled.");
		}
	});
}

// Function to store a shift in database.
function storeShift(employeeId, dateStart, dateEnd, timeStart, timeEnd, callback) {
	db.run("INSERT INTO shifts (employeeId, dateStart, dateEnd, timeStart, timeEnd) VALUES($employeeId, $dateStart, $dateEnd, $timeStart, $timeEnd)", {
			$employeeId: employeeId,
			$dateStart: dateStart,
			$dateEnd: dateEnd,
			$timeStart: timeStart,
			$timeEnd: timeEnd
		}, (err) => {
			if (err) {
				callback(err, null);
			} 
			else {
				callback(null, "New shift for employee #" + employeeId + " stored.");
			}
		}
	);
}

//Function to cancel (delete) a shift
function deleteShift(id, callback) {
	db.run("DELETE FROM shifts WHERE id=$id", {
		$id:id
	}, (err) => {
		if(err) {
			callback(err);
		}
		else {
			callback("Shift #" +id +" cancelled.");
		}
	});
}

//Function to store a holiday in the database by user id
function storeHoliday(employeeId, dateStart, dateEnd, callback) {
	db.run("INSERT INTO holidays (employeeId, dateStart, dateEnd) VALUES($employeeId, $dateStart, $dateEnd)", {
		$employeeId: employeeId,
		$dateStart: dateStart,
		$dateEnd: dateEnd
	}, (err) => {
		if(err) {
			callback(err);
		}
		else {
			callback("New holiday for employee #" + employeeId + " stored.");
		}
	});
}

//Function to delete holiday from the system
function deleteHoliday(id, callback) {
	db.run("DELETE FROM holidays WHERE id=$id", {
		$id:id
	}, (err) => {
		if(err) {
			callback(err);
		}
		else {
			callback("Holiday #" +id +" cancelled.");
		}
	});
}

//Function to retrieve user by user id
function getUserById(id, callback) {
	db.get("SELECT * FROM accounts WHERE id=$id", { 
			$id: id
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

//Function to retrieve user by email
function getUserByEmail(email, callback) {
	db.get("SELECT * FROM accounts WHERE username=$username", { 
		$username: email
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

// Function to retrieve user role by user id
function getUserRole(id, callback) { 
	db.get("SELECT role FROM accounts WHERE id=$id", { 
			$id: id
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

//Function to retrieve a shift by its id
function getShift(id, callback) {
	db.get("SELECT * FROM shifts INNER JOIN accounts ON shifts.employeeId=accounts.id WHERE shifts.id=$id", {
		$id:id
	}, (err, row) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, row);
		}
	});
}

//Function to retrieve a request by its id
function getRequest(requestId, callback) {
	db.get("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId=accounts.id WHERE requests.requestId=$requestId", {
		$requestId: requestId
	}, (err, row) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, row);
		}
	});
}

//Function to retrieve a holiday by its id
function getHoliday(id, callback) {
	db.get("SELECT * FROM requests INNER JOIN accounts ON holidays.employeeId=accounts.id WHERE holidays.id=$id", {
		$id:id
	}, (err, row) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, row);
		}
	});
}

//Function to retrieve a user's requests by their id
function getUserRequests(employeeId, callback) {
	db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.id WHERE requests.employeeId=$employeeId", {
			$employeeId: employeeId
		}, (err, rows) => {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, rows);
			}
		}
	);
}
 
//Function to retrieve a user's shifts by their id
function getUserShifts(id, callback) {
	db.all("SELECT * FROM shifts INNER JOIN accounts ON shifts.employeeId = accounts.id WHERE shifts.employeeId=$employeeId", {
		$employeeId: employeeId
		}, (err, rows) => {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, rows);
			}
		}
	);
}

//Function to retrieve a user's holidays by their id
function getUserholidays(id, callback) {
	db.all("SELECT * FROM holidays INNER JOIN accounts ON holidays.employeeId = accounts.id WHERE holidays.employeeId=$employeeId", {
		$employeeId: employeeId
		}, (err, rows) => {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, rows);
			}
		}
	);
}


//Function to delete all of a user's requests 
function deleteAllUserRequests(employeeId, callback) {
	db.run("DELETE * FROM requests INNER JOIN accounts ON requests.employeeId=accounts.id WHERE requests.employeeId=$employeeId", {
		$employeeId: employeeId
	}, (err) => {
		if(err) {
			callback(err);
		}
		else {
			callback("All requests cancelled.");
		}
	});
}

//Function to delete all of a user's shifts
function deleteAllUserShifts(employeeId, callback) {
	db.run("DELETE * FROM shifts INNER JOIN accounts ON shifts.employeeId=accounts.id WHERE shifts.employeeId=$employeeId", {
		$employeeId: employeeId
	}, (err) => {
		if(err) {
			callback(err);
		}
		else {
			callback("All shifts for employee #" + employeeId + " cancelled.");
		}
	});
}

//Function to delete all of a user's holidays
function deleteAllUserHolidays(employeeId, callback) {
	db.run("DELETE * FROM holidays INNER JOIN accounts ON holidays.employeeId = accounts.id WHERE holidays.employeeId=$employeeId", {
		$employeeId: employeeId
	}, (err) => {
		if(err) {
			callback(err);
		}
		else {
			callback("All holidays for employee #" + employeeId + " cancelled.");
		}
	});
}

//Function to retrieve all pending requests on the system
function getAllRequests(callback) {
	db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.id", (err, rows) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, rows);
		}
	});
}

//Function to retrieve only shift requests from the system
function getAllShiftRequests(callback) {
		db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.id WHERE type='Shift'", (err, rows) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, rows);
		}
	});
}

//Function to retrieve only holiday requests from the system
function getAllHolidayRequests(callback) {
		db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.id WHERE type='Holiday'", (err, rows) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, rows);
		}
	});
}

//Function to retrieve all shifts on the system
function getAllShifts(callback) {
	db.all("SELECT * FROM shifts INNER JOIN accounts ON shifts.employeeId = accounts.id", (err, rows) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, rows);
		}
	});
}

//Function to retrieve all holidays on the system
function getAllHolidays(callback) {
	db.all("SELECT * FROM holidays INNER JOIN accounts ON holidays.employeeId = accounts.id", (err, rows) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, rows);
		}
	});
}




module.exports.getAllHolidays = getAllHolidays;
module.exports.getAllShifts = getAllShifts;
module.exports.getAllHolidayRequests = getAllHolidayRequests;
module.exports.getAllShiftRequests = getAllShiftRequests;
module.exports.getAllRequests = getAllRequests;
module.exports.deleteAllUserHolidays = deleteAllUserHolidays;
module.exports.deleteAllUserShifts = deleteAllUserShifts;
module.exports.deleteAllUserRequests = deleteAllUserRequests;
module.exports.getUserShifts = getUserShifts;
module.exports.getUserRequests = getUserRequests;
module.exports.getUserRole = getUserRole;
module.exports.getUserByEmail = getUserByEmail;
module.exports.getUserById = getUserById;
module.exports.deleteHoliday = deleteHoliday;
module.exports.storeHoliday = storeHoliday;
module.exports.deleteShift = deleteShift;
module.exports.storeShift = storeShift;
module.exports.deleteRequest = deleteRequest;
module.exports.storeRequest = storeRequest;
module.exports.deleteUser = deleteUser;
module.exports.storeUser = storeUser;
module.exports.initialise = initialise;
module.exports.getRequest = getRequest;
module.exports.getHoliday = getHoliday;
module.exports.getShift = getShift;
module.exports.storeMessage = storeMessage;
module.exports.getMessage = getMessage;
module.exports.getUserMessages = getUserMessages;
module.exports.getUserSentMessages = getUserSentMessages;
module.exports.deleteMessage = deleteMessage;
module.exports.deleteAllUserMessages = deleteAllUserMessages;
module.exports.deleteAllUserSentMessages = deleteAllUserSentMessages;
	

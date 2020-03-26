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
		db.run("CREATE TABLE accounts(employeeId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, firstName TEXT, surname TEXT, jobTitle, username TEXT, password TEXT, role TEXT)");
		db.run("CREATE TABLE requests(requestId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employeeId INTEGER, type TEXT, dateTimeSubmitted TEXT, dateStart TEXT, dateEnd TEXT, timeStart TEXT, timeEnd TEXT)");
		db.run("CREATE TABLE shifts(shiftId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employeeId INTEGER, dateStart TEXT, dateEnd TEXT, timeStart TEXT, timeEnd TEXT)");
		db.run("CREATE TABLE holidays(holidayId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employeeId INTEGER, dateStart TEXT, dateEnd TEXT)");
		db.run("CREATE TABLE messages(messageId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, dateTimeSubmitted TEXT, body TEXT, senderId INTEGER, recipientId INTEGER)");
	});
}

// Function to store a user.
function storeUser(firstName, surname, jobTitle, email, passwordHash, role, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.storeUser() called.");
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
				db.get("SELECT last_insert_rowid() AS newUserId", 
				(err, row) => {
					if(err) {
						console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
					}
					else {
						callback(null, { message: "User #" + row.newUserId + " stored successfully.", newUserId: row.newUserId });
					}
				});
			}
		}
	);
}

//function to delete a user from the database by their employeeId
function deleteUser(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteUser() called.");
	db.run("DELETE FROM accounts WHERE employeeId=$employeeId", {
		$employeeId:employeeId
	}, (err) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, "User " + employeeId + " deleted from the database.");
		}
	});
}

//function to store a message in the messages table
function storeMessage(senderId, recipientId, dateTimeSubmitted, body, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.storeMessage() called.");
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
			db.get("SELECT last_insert_rowid() AS newMessageId", 
				(err, row) => {
					if(err) {
						console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
					}
					else {
						callback(null, { message: "New message #" + row.newMessageId + " for user " + recipientId + " stored.", newMessageId: row.newMessageId});
					}
			});
		}
	});
}

//function to retrieve a message by its message employeeId
function getMessage(messageId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getMessage() called.");
	db.get("SELECT * FROM messages INNER JOIN accounts ON messages.senderId=accounts.employeeId WHERE messageId=$messageId", {
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

//function to retrieve all of a users messages by their employee employeeId
function getUserMessages(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getUserMessages() called.");
	db.all("SELECT * FROM messages INNER JOIN accounts ON messages.recipientId=accounts.employeeId WHERE recipientId=$employeeId ORDER BY messages.messageId DESC", {
		$employeeId: employeeId
	}, (err, rows) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, rows);
		}
	});
}

//function to retrieve a user's sent messages by their employee employeeId
function getUserSentMessages(senderId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getUserSentMessages() called.");
	db.all("SELECT * FROM messages INNER JOIN accounts ON messages.recipientId=accounts.employeeId WHERE senderId=$senderId", {
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
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteMessage() called.");
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
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteAllUserMessages() called.");
	db.run("DELETE * FROM messages WHERE recipientId=$employeeId", {
		$employeeId: employeeId
	}, (err) => {
		if(err) {
			callback(err, null);
		} else {
			callback(null, "User employeeId " + employeeId +  "'s messages deleted");
		}
	});
}

//function to delete all of a user's sent messages
function deleteAllUserSentMessages(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteAllUserSentMessages() called.");
	db.run("DELETE * FROM messages WHERE senderId=$employeeId", {
		$employeeId:employeeId
	}, (err) => {
		if(err) {
			callback(err, null);
		} else {
			callback(null, "User employeeId " + employeeId + "'s sent messages deleted.");
		}
	});
}

// Function to store a request in database
function storeRequest(employeeId, type, dateTimeSubmitted, dateStart, dateEnd, timeStart, timeEnd, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.storeRequest() called.");
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
				console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  "New request submitted for user #" + employeeId);
				db.get("SELECT last_insert_rowid() AS newRequestId", 
				(err, row) => {
					if(err) {
						console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
					}
					else {
						callback(null, { message: "New request (#" + row.newRequestId + ") for user #" + employeeId + " stored.", newRequestId: row.newRequestId});
					}
				});
			}
	});
}

//Function to cancel (delete) a request from the database
function deleteRequest(requestId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteRequest() called.");
	db.run("DELETE FROM requests WHERE requestId=$requestId", {
		$requestId:requestId
	}, (err) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, "Request " + requestId +" cancelled.");
		}
	});
}

// Function to store a shift in database.
function storeShift(employeeId, dateStart, dateEnd, timeStart, timeEnd, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.storeShift() called.");
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
				db.get("SELECT last_insert_rowid() AS newShiftId", 
				(err, row) => {
					if(err) {
						console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
					}
					else {
						callback(null, { message: "New shift (#" +row.newShiftId + ") for user #" + employeeId + " stored.", newShiftId: row.newShiftId});
					}
				});
			}
		}
	);
}

//Function to cancel (delete) a shift
function deleteShift(shiftId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteShift() called.");
	db.run("DELETE FROM shifts WHERE shiftId=$shiftId", {
		$shiftId:shiftId
	}, (err) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, "Shift #" +shiftId +" cancelled.");
		}
	});
}

//Function to store a holiday in the database by user employeeId
function storeHoliday(employeeId, dateStart, dateEnd, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.storeHoliday()");
	db.run("INSERT INTO holidays (employeeId, dateStart, dateEnd) VALUES($employeeId, $dateStart, $dateEnd)", {
		$employeeId: employeeId,
		$dateStart: dateStart,
		$dateEnd: dateEnd
	}, (err) => {
		if(err) {
			callback(err);
		}
		else {
			db.get("SELECT last_insert_rowid() AS newHolidayId", 
				(err, row) => {
					if(err) {
						console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
					}
					else {
						callback(null, { message: "New holiday (#" + row.newHolidayId + ") for user " + employeeId + " stored.", newHolidayId: row.newHolidayId});
					}
			});
		}
	});
}

//Function to delete holiday from the system
function deleteHoliday(holidayId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteHoliday() called.");
	db.run("DELETE * FROM holidays WHERE holidayId=$holidayId", {
		$holidayId:holidayId
	}, (err) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, "Holiday #" +holidayId +" cancelled.");
		}
	});
}

//Function to retrieve user by user employeeId
function getUserById(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getUserById() called.");
	db.get("SELECT * FROM accounts WHERE employeeId=$employeeId", { 
			$employeeId: employeeId
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
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getUserByEmail() called.");
	db.get("SELECT * FROM accounts WHERE username=$username", { 
		$username: email
		}, (err, row) => { 
			if (err) { 
				callback(err, row); 
			} 
			else { 
				callback(null, row); 
			} 
		} 
	); 
}

// Function to retrieve user role by user employeeId
function getUserRole(employeeId, callback) { 
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getUserRole() called.");
	db.get("SELECT role FROM accounts WHERE employeeId=$employeeId", { 
			$employeeId: employeeId
		}, (err, row) => { 
			if (err) { 
				callback(err, row); 
			} 
			else { 
				callback(null, row.role); 
			} 
		} 
	); 
} 

//Function to retrieve a shift by its employeeId
function getShift(shiftId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getShift() called.");
	db.get("SELECT * FROM shifts INNER JOIN accounts ON shifts.employeeId=accounts.employeeId WHERE shifts.shiftId=$shiftId", {
		$shiftId:shiftId
	}, (err, row) => {
		if(err) {
			callback(err, row);
		}
		else {
			callback(null, row);
		}
	});
}

//Function to retrieve a request by its employeeId
function getRequest(requestId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getRequest() called.");
	db.get("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId=accounts.employeeId WHERE requests.requestId=$requestId", {
		$requestId: requestId
	}, (err, row) => {
		if(err) {
			callback(err, row);
		}
		else {
			callback(null, row);
		}
	});
}

//Function to retrieve a holiday by its employeeId
function getHoliday(holidayId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getHoliday() called.");
	db.get("SELECT * FROM requests INNER JOIN accounts ON holidays.employeeId=accounts.employeeId WHERE holidays.holidayId=$holidayId", {
		$holidayId:holidayId
	}, (err, row) => {
		if(err) {
			callback(err, row);
		}
		else {
			callback(null, row);
		}
	});
}

//Function to retrieve a user's requests by their employeeId
function getUserRequests(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getUserRequests() called.");
	db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.employeeId WHERE requests.employeeId=$employeeId", {
			$employeeId: employeeId
		}, (err, rows) => {
			if (err) {
				callback(err, rows);
			}
			else {
				callback(null, rows);
			}
		}
	);
}
 
//Function to retrieve a user's shifts by their employeeId
function getUserShifts(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getUserShifts() called.");
	db.all("SELECT * FROM shifts INNER JOIN accounts ON shifts.employeeId = accounts.employeeId WHERE shifts.employeeId=$employeeId", {
		$employeeId: employeeId
		}, (err, rows) => {
			if (err) {
				callback(err, rows);
			}
			else {
				callback(null, rows);
			}
		}
	);
}

//Function to retrieve a user's holidays by their employeeId
function getUserHolidays(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getUserHolidays() called.");
	db.all("SELECT * FROM holidays INNER JOIN accounts ON holidays.employeeId = accounts.employeeId WHERE holidays.employeeId=$employeeId", {
		$employeeId: employeeId
		}, (err, rows) => {
			if (err) {
				callback(err, rows);
			}
			else {
				callback(null, rows);
			}
		}
	);
}


//Function to delete all of a user's requests 
function deleteAllUserRequests(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteAllUserRequests() called.");
	db.run("DELETE * FROM requests INNER JOIN accounts ON requests.employeeId=accounts.employeeId WHERE requests.employeeId=$employeeId", {
		$employeeId: employeeId
	}, (err) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, "All requests cancelled.");
		}
	});
}

//Function to delete all of a user's shifts
function deleteAllUserShifts(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteAllUserShifts() called.");
	db.run("DELETE * FROM shifts INNER JOIN accounts ON shifts.employeeId=accounts.employeeId WHERE shifts.employeeId=$employeeId", {
		$employeeId: employeeId
	}, (err) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, "All shifts for employee #" + employeeId + " cancelled.");
		}
	});
}

//Function to delete all of a user's holidays
function deleteAllUserHolidays(employeeId, callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.deleteAllUserHolidays() called.");
	db.run("DELETE * FROM holidays INNER JOIN accounts ON holidays.employeeId = accounts.employeeId WHERE holidays.employeeId=$employeeId", {
		$employeeId: employeeId
	}, (err) => {
		if(err) {
			callback(err, null);
		}
		else {
			callback(null, "All holidays for employee #" + employeeId + " cancelled.");
		}
	});
}

//Function to retrieve all pending requests on the system
function getAllRequests(callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getAllRequests() called.");
	db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.employeeId", (err, rows) => {
		if(err, rows) {
			callback(err, rows);
		}
		else {
			callback(null, rows);
		}
	});
}

//Function to retrieve only shift requests from the system
function getAllShiftRequests(callback) {
	    console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getAllShiftRequests() called.");
		db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.employeeId WHERE type='Shift'", (err, rows) => {
		if(err, rows) {
			callback(err, rows);
		}
		else {
			callback(null, rows);
		}
	});
}

//Function to retrieve only holiday requests from the system
function getAllHolidayRequests(callback) {
		console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getAllHolidayRequests() called.");
		db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.employeeId WHERE type='Holiday'", (err, rows) => {
		if(err, rows) {
			callback(err, rows);
		}
		else {
			callback(null, rows);
		}
	});
}

//Function to retrieve all shifts on the system
function getAllShifts(callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getAllShifts() called.");
	db.all("SELECT * FROM shifts INNER JOIN accounts ON shifts.employeeId = accounts.employeeId", (err, rows) => {
		if(err, rows) {
			callback(err, rows);
		}
		else {
			callback(null, rows);
		}
	});
}

//Function to retrieve all holidays on the system
function getAllHolidays(callback) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "dbController.getAllHolidays() called.");
	db.all("SELECT * FROM holidays INNER JOIN accounts ON holidays.employeeId = accounts.employeeId", (err, rows) => {
		if(err, rows) {
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
module.exports.getUserHolidays = getUserHolidays;
	

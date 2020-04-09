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
        db.run("CREATE TABLE tasks(taskId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, employeeId INTEGER, type TEXT, dateStart TEXT, dateEnd TEXT, timeStart TEXT, timeEnd TEXT)");
        db.run("CREATE TABLE messages(messageId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, sender TEXT, recipientId INTEGER, dateTimeSubmitted TEXT, body TEXT)");
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
        } else {
            db.get("SELECT last_insert_rowid() AS newUserId",
                (err, row) => {
                    if (err) {
                        console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
                    } else {
                        callback(null, { message: "User #" + row.newUserId + " stored successfully.", newUserId: row.newUserId });
                    }
                });
        }
    });
}

//function to delete a user from the database by their employeeId
function deleteUser(employeeId, callback) {
    db.run("DELETE FROM accounts WHERE employeeId=$employeeId", {
        $employeeId: employeeId
    }, (err) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, "User " + employeeId + " deleted from the database.");
        }
    });
}

//function to store a message in the messages table
function storeMessage(senderId, recipientId, dateTimeSubmitted, body, callback) {
	
	getUserById(senderId, function (err, sender) {
		if(err) {
			console.log(time_now() + err);
		}
		else {
			  db.run("INSERT INTO messages (sender, recipientId, dateTimeSubmitted, body) VALUES($sender, $recipientId, $dateTimeSubmitted, $body)", {
					$sender: JSON.stringify(sender),
					$recipientId: recipientId,
					$dateTimeSubmitted: dateTimeSubmitted,
					$body: body
				}, (err) => {
					if (err) {
						callback(err, null);
					} else {
						db.get("SELECT last_insert_rowid() AS newMessageId",
							(err, row) => {
								if (err) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
								} else {
									callback(null, { message: "New message #" + row.newMessageId + " for user " + recipientId + " stored.", newMessageId: row.newMessageId });
								}
							});
					}
				});
		}
	});
  
}

//function to retrieve a message by its message employeeId
function getMessage(messageId, callback) {
    db.get("SELECT * FROM messages INNER JOIN accounts ON messages.senderId=accounts.employeeId WHERE messageId=$messageId", {
        $messageId: messageId
    }, (err, row) => {
        if (err) {
            callback(err, null);
        } else {
            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);

            callback(null, row);
        }
    });
}

//function to retrieve all of a users messages by their employee employeeId
function getUserMessages(employeeId, callback) {
    db.all("SELECT * FROM messages INNER JOIN accounts ON messages.recipientId=accounts.employeeId WHERE recipientId=$employeeId ORDER BY messages.messageId DESC", {
        $employeeId: employeeId
    }, (err, rows) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, rows);
		
        }
    });
}

//function to retrieve a user's sent messages by their employee employeeId
function getUserSentMessages(senderId, callback) {
    db.all("SELECT * FROM messages INNER JOIN accounts ON messages.recipientId=accounts.employeeId WHERE senderId=$senderId", {
        $senderId: senderId
    }, (err, rows) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
}

//function to delete a specific message
function deleteMessage(messageId, callback) {
    db.run("DELETE * FROM messages WHERE messageId=$messageId", {
        $messageId: messageId
    }, (err) => {
        if (err) {
            callback(err, null);
        } else {
            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);

            callback(null, "Message " + messageId + " deleted.");
        }
    });
}

//function to delete all of a user's messages
function deleteAllUserMessages(employeeId, callback) {
    db.run("DELETE * FROM messages WHERE recipientId=$employeeId", {
        $employeeId: employeeId
    }, (err) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, "User employeeId " + employeeId + "'s messages deleted");
        }
    });
}

//function to delete all of a user's sent messages
function deleteAllUserSentMessages(employeeId, callback) {
    db.run("DELETE * FROM messages WHERE senderId=$employeeId", {
        $employeeId: employeeId
    }, (err) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, "User employeeId " + employeeId + "'s sent messages deleted.");
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
        } else {
            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "New request submitted for user #" + employeeId);
            db.get("SELECT last_insert_rowid() AS newRequestId",
                (err, row) => {
                    if (err) {
                        console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
                    } else {
                        callback(null, { message: "New request (#" + row.newRequestId + ") for user #" + employeeId + " stored.", newRequestId: row.newRequestId });
                    }
                });
        }
    });
}

//Function to cancel (delete) a request from the database
function deleteRequest(requestId, callback) {
    db.run("DELETE FROM requests WHERE requestId=$requestId", {
        $requestId: requestId
    }, (err) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, "Request " + requestId + " cancelled.");
        }
    });
}

// Function to store a task in database.
function storeTask(employeeId, type, dateStart, dateEnd, timeStart, timeEnd, callback) {
    db.run("INSERT INTO tasks (employeeId, type, dateStart, dateEnd, timeStart, timeEnd) VALUES($employeeId, $type, $dateStart, $dateEnd, $timeStart, $timeEnd)", {
        $employeeId: employeeId,
        $type: type,
        $dateStart: dateStart,
        $dateEnd: dateEnd,
        $timeStart: timeStart,
        $timeEnd: timeEnd
    }, (err) => {
        if (err) {
            callback(err, null);
        } else {
            db.get("SELECT last_insert_rowid() AS newTaskId",
                (err, row) => {
                    if (err) {
                        console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
                    } else {
                        callback(null, { message: "New shift (#" + row.newTaskId + ") for user #" + employeeId + " stored.", newTaskId: row.newTaskId });
                    }
                });
        }
    });
}

//Function to retrieve a task by its employeeId
function getTask(taskId, callback) {
    db.get("SELECT * FROM tasks INNER JOIN accounts ON tasks.employeeId=accounts.employeeId WHERE tasks.taskId=$taskId", {
        $taskId: taskId
    }, (err, row) => {
        if (err) {
            callback(err, row);
        } else {
            callback(null, row);
        }
    });
}

//Function to cancel (delete) a task
function deleteTask(taskId, callback) {
    db.run("DELETE FROM tasks WHERE taskId=$taskId", {
        $taskId: taskId
    }, (err) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, "Task #" + taskId + " cancelled.");
        }
    });
}

//Function to retrieve user by user employeeId
function getUserById(employeeId, callback) {
    db.get("SELECT * FROM accounts WHERE employeeId=$employeeId", {
        $employeeId: employeeId
    }, (err, row) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, row);
        }
    });
}

//Function to retrieve user by email
function getUserByEmail(email, callback) {

    db.get("SELECT * FROM accounts WHERE username=$username", {
        $username: email
    }, (err, row) => {
        if (err) {
            callback(err, row);
        } else {
            callback(null, row);
        }
    });
}

// Function to retrieve user role by user employeeId
function getUserRole(employeeId, callback) {
    db.get("SELECT role FROM accounts WHERE employeeId=$employeeId", {
        $employeeId: employeeId
    }, (err, row) => {
        if (err) {
            callback(err, row);
        } else {
            callback(null, row.role);
        }
    });
}

//Function to retrieve a request by its employeeId
function getRequest(requestId, callback) {
    db.get("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId=accounts.employeeId WHERE requests.requestId=$requestId", {
        $requestId: requestId
    }, (err, row) => {
        if (err) {
            callback(err, row);
        } else {
            callback(null, row);
        }
    });
}

//Function to retrieve a user's requests by their employeeId
function getUserRequests(employeeId, callback) {
    db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.employeeId WHERE requests.employeeId=$employeeId", {
        $employeeId: employeeId
    }, (err, rows) => {
        if (err) {
            callback(err, rows);
        } else {
            callback(null, rows);
        }
    });
}

//Function to delete all of a user's requests 
function deleteAllUserRequests(employeeId, callback) {
    db.run("DELETE * FROM requests INNER JOIN accounts ON requests.employeeId=accounts.employeeId WHERE requests.employeeId=$employeeId", {
        $employeeId: employeeId
    }, (err) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, "All requests cancelled.");
        }
    });
}

//Function to retrieve a user's tasks by their employeeId
function getUserTasks(employeeId, callback) {
    db.all("SELECT * FROM tasks INNER JOIN accounts ON tasks.employeeId = accounts.employeeId WHERE tasks.employeeId=$employeeId", {
        $employeeId: employeeId
    }, (err, rows) => {
        if (err) {
            callback(err, rows);
        } else {
            callback(null, rows);
        }
    });
}

//Function to retrieve a user's tasks by their employeeId and task type.
//Type can be "Holiday" or "Shift"
function getUserTasksByType(employeeId, type, callback) {
    db.all("SELECT * FROM tasks INNER JOIN accounts ON tasks.employeeId = accounts.employeeId WHERE tasks.employeeId=$employeeId AND tasks.type=$type", {
        $employeeId: employeeId,
        $type: type
    }, (err, rows) => {
        if (err) {
            callback(err, rows);
        } else {
            callback(null, rows);
        }
    });
}

//Function to delete all of a user's tasks
function deleteAllUserTasks(employeeId, callback) {
    db.run("DELETE * FROM tasks INNER JOIN accounts ON tasks.employeeId=accounts.employeeId WHERE tasks.employeeId=$employeeId", {
        $employeeId: employeeId
    }, (err) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, "All tasks for employee #" + employeeId + " cancelled.");
        }
    });
}

//Function to retrieve all tasks on the system
function getAllTasks(callback) {
    db.all("SELECT * FROM tasks INNER JOIN accounts ON tasks.employeeId = accounts.employeeId", (err, rows) => {
        if (err, rows) {
            callback(err, rows);
        } else {
            callback(null, rows);
        }
    });
}

//Function to retrieve all shifts on the system
function getAllShifts(callback) {
	db.all("SELECT * FROM tasks INNER JOIN accounts ON tasks.employeeId = accounts.employeeId WHERE tasks.type = 'Shift' ORDER BY tasks.dateStart ASC", (err, rows) => {
        if (err, rows) {
            callback(err, rows);
        } else {
            callback(null, rows);
        }
    });
}

//Function to retrieve all holidays on the system
function getAllHolidays(callback) {
	db.all("SELECT * FROM tasks INNER JOIN accounts ON tasks.employeeId = accounts.employeeId WHERE tasks.type = 'Holiday' ORDER BY tasks.dateStart ASC", (err, rows) => {
		if(err, rows) {
			callback(err, rows);
		}
		else {
			callback(null, rows);
		}
	});
}

//Function to return shifts with matching start and end times to a given shift 
function getMatchingShifts(shiftId, dateStart, dateEnd, timeStart, timeEnd, callback) {
	db.all("SELECT * FROM tasks INNER JOIN accounts on tasks.employeeId = accounts.employeeId WHERE tasks.dateStart = $dateStart AND tasks.dateEnd = $dateEnd AND tasks.timeStart = $timeStart AND tasks.timeEnd = $timeEnd AND tasks.taskId != $shiftId", {
		$shiftId: shiftId,
		$dateStart: dateStart,
		$dateEnd: dateEnd,
		$timeStart: timeStart,
		$timeEnd: timeEnd
		}, (err, rows) => {
			if(err) {
				callback(err, null);
			}
			else {
				callback(null, rows);
			}
	});
}

//Function to retrieve all pending requests on the system
function getAllRequests(callback) {
    db.all("SELECT * FROM requests INNER JOIN accounts ON requests.employeeId = accounts.employeeId", (err, rows) => {
        if (err, rows) {
            callback(err, rows);
        } else {
            callback(null, rows);
        }
    });
}

module.exports.getAllTasks = getAllTasks;
module.exports.getAllRequests = getAllRequests;
module.exports.getAllShifts = getAllShifts;
module.exports.getMatchingShifts = getMatchingShifts;
module.exports.getAllHolidays = getAllHolidays;

module.exports.initialise = initialise;
module.exports.storeTask = storeTask;
module.exports.getUserTasks = getUserTasks;
module.exports.getUserTasksByType = getUserTasksByType;
module.exports.deleteTask = deleteTask;
module.exports.deleteAllUserTasks = deleteAllUserTasks;

module.exports.storeRequest = storeRequest;
module.exports.getRequest = getRequest;

module.exports.deleteAllUserRequests = deleteAllUserRequests;
module.exports.getUserRequests = getUserRequests;
module.exports.getUserRole = getUserRole;
module.exports.getUserByEmail = getUserByEmail;
module.exports.getUserById = getUserById;
module.exports.deleteRequest = deleteRequest;
module.exports.deleteUser = deleteUser;
module.exports.storeUser = storeUser;
module.exports.getTask = getTask;
module.exports.storeMessage = storeMessage;
module.exports.getMessage = getMessage;
module.exports.getUserMessages = getUserMessages;
module.exports.getUserSentMessages = getUserSentMessages;
module.exports.deleteMessage = deleteMessage;
module.exports.deleteAllUserMessages = deleteAllUserMessages;
module.exports.deleteAllUserSentMessages = deleteAllUserSentMessages;
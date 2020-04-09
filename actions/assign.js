// Module requirements.
const moment = require("moment");

// Own code requirements.
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");


function time_now() { return "\n[" + moment().format("YYYY-MM-DD - HH:mm:ss") + "]: "; };

function message_time() { return moment().format("YYYY-MM-DD - HH:mm"); };


function get(req, res) {
    //Get role
    role = dbController.getUserRole(req.user.employeeId, function callback(err, role) {
        if (err) {
            console.log(time_now() + err);
        } else {
            // Check if role can do the action.
            permission = acl.ac.can(role).execute("assign").sync().on("schedule");

            // Continue if yes, reject if no.
            if (permission.granted) {
                return res.render("pages/assign.ejs", { info: "" });
            } else {
                return res.render("pages/denied.ejs", { username: req.user.firstName });
            }
        }
    });
}

function post(req, res) {
    //Get role
    dbController.getUserRole(req.user.employeeId, function callback(err, role) {
        if (err) {
            console.log(time_now() + err)
        } else {
            // Check if role can do the action.
            permission = acl.ac.can(role).execute("assign").sync().on("schedule");
            // Continue if yes, reject if no.
            if (permission.granted) {

                // Get the input from the request body.
                const input = req.body;
                console.log(time_now() + "New " + input.type + " assignment for user #" + input.employeeId + " - " +
                    input.dateStart + " " + input.timeStart + " - " + input.dateEnd + " " + input.timeEnd);

                //create moment objects for the date/time start and date/time end of the request.
                const dateTimeStart = input.dateStart + " " + input.timeStart;
                const dateTimeEnd = input.dateEnd + " " + input.timeEnd;
                const momentStart = moment(dateTimeStart);
                const momentEnd = moment(dateTimeEnd);

                console.log(time_now() + "Checking assignment is valid..");

                //Flag to indicate a logically invalid assignment
                var invalidAssignment = 0;

                //Ensure request start date/time and end date/time are valid
                if (moment(momentStart).isAfter(momentEnd)) {
                    invalidAssignment = 1;
                    return res.render('pages/assign.ejs', { username: req.user.firstName, info: "Invalid request: the end time must be after the start time." });
                }
                if (moment(momentStart).isSame(momentEnd)) {
                    invalidAssignment = 1;
                    return res.render('pages/assign.ejs', { username: req.user.firstName, info: "Invalid request: the start time and end time are the same." });
                }

                //If assignment is logically valid, proceed to check for clashes 
                if (!invalidAssignment) {
                    // Get the user's existing requests to check for clashes
                    dbController.getUserByEmail(input.email, function(err, result) {
                        if (err) {
                            console.log(time_now() + err);
                        } else {
                            var employeeId = result.employeeId;
							if(employeeId) {
								
							} else {
								return res.render ('pages/assign.ejs', { username: req.user.firstName, info: "No user with that email found." });
							}
                            dbController.getUserRequests(employeeId, function(err, pendingRequests) {
                                if (err) {
                                    console.log(time_now() + err);

                                    //Render the requests page with the error as the info message.
                                    //storeAndRender(req, res, err);
                                } else {
                                    console.log(time_now() + pendingRequests.length + " requests found for user #" + employeeId);

                                    //get the user's requests to check for clashes
                                    dbController.getUserTasks(employeeId, function(err, userTasks) {
                                        if (err) {
                                            console.log(time_now() + err);

                                            //Render the requests page with the error as the info message.
                                            //storeAndRender(req, res, err);
                                        } else {
                                            console.log(time_now() + userTasks.length + " tasks found for user #" + employeeId);

                                            //Get the user's tasks to check for clashes  
                                            //Create vars to hold moment objects for date-time start and date-time end of the existing request.
                                            var requestDateTimeStart;
                                            var requestDateTimeEnd;
                                            var taskDateStart;
                                            var taskDateEnd;

                                            //arrays to delete clashing tasks and requests
                                            var requestClashes = [];
                                            var taskClashes = [];

                                            for (var i = 0; i <= pendingRequests.length; i++) {

                                                //Only try to check the request if the next index is not empty
                                                if (pendingRequests[i]) {

                                                    //Create moment objects for the existing request
                                                    requestDateTimeStart = pendingRequests[i].dateStart + " " + pendingRequests[i].timeStart;
                                                    requestDateTimeEnd = pendingRequests[i].dateEnd + " " + pendingRequests[i].timeEnd;
                                                    requestMomentStart = moment(requestDateTimeStart);
                                                    requestMomentEnd = moment(requestDateTimeEnd);

                                                    //If the start date of the user's request is the same as the start or end date of an existing request, or
                                                    // lies between the start and end date of an existing request..
                                                    if (moment(momentStart).isBetween(requestMomentStart, requestMomentEnd) === true ||
                                                        moment(momentEnd).isBetween(requestMomentStart, requestMomentEnd) === true ||
														moment(requestMomentStart).isBetween(momentStart, momentEnd) === true ||
                                                        moment(momentStart).isSame(requestMomentStart) === true ||
                                                        moment(momentEnd).isSame(requestMomentStart) === true ||
                                                        moment(momentStart).isSame(requestMomentEnd) === true ||
                                                        moment(momentEnd).isSame(requestMomentEnd) === true
                                                    ) {

                                                        //add to list of clashing requests
                                                        requestClashes.push(pendingRequests[i]);
                                                    }
                                                }
                                                if (i === pendingRequests.length) {
                                                    taskMomentEnd = moment(taskDateEnd);
                                                    console.log(time_now() + "Checked " + i + " requests for user #" + employeeId + ", " + requestClashes.length + " clashes detected.");

                                                    // Same for tasks.
                                                    console.log(time_now() + "Checking user's existing tasks for clashes..");
                                                    for (var k = 0; k <= userTasks.length; k++) {
                                                        if (userTasks[k]) {

                                                            // Create moment object for the existing task
                                                            taskDateStart = userTasks[k].dateStart + " " + userTasks[k].timeStart;
                                                            taskDateEnd = userTasks[k].dateEnd + " " + userTasks[k].timeEnd;
                                                            taskMomentStart = moment(taskDateStart);
                                                            taskMomentEnd = moment(taskDateEnd);

                                                            // If the start date of the user's request is the same as the start or end date of an existing request, or
                                                            // lies between the start and end date of an existing request..
                                                            if (moment(momentStart).isBetween(taskMomentStart, taskMomentEnd) === true ||
                                                                moment(momentEnd).isBetween(taskMomentStart, taskMomentEnd) === true ||
																moment(taskMomentStart).isBetween(momentStart, momentEnd) === true ||
                                                                moment(momentStart).isSame(taskMomentStart) === true ||
                                                                moment(momentEnd).isSame(taskMomentStart) === true ||
                                                                moment(momentStart).isSame(taskMomentEnd) === true ||
                                                                moment(momentEnd).isSame(taskMomentEnd) === true
																) {
																console.log(time_now() + "Invalid assignment - clash detected with task #" + userTasks[k].taskId + ".");
																if(input.autoCancel) {
																	taskClashes.push(userTasks[k]);
																}
																else {
																	return res.render('pages/assign', { username: req.user.firstName, info: "Invalid assignment - clash detected with " + userTasks[k].type + " #" + userTasks[k].taskId + ", consider cancelling that " + userTasks[k].type + " first." });
																}
                                                            }
                                                        }
                                                        if (k === userTasks.length) {
                                                            console.log(time_now() + "Checked " + k + " tasks for user #" + employeeId + ", " + taskClashes.length + " clashes detected.");

                                                            if (input.autoCancel && (taskClashes.length || requestClashes.length)) {
                                                                deleteClashes(req.user, res, input, employeeId, requestClashes, taskClashes);
                                                            } else {
                                                                storeAndRender(req.user, res, employeeId, input.type, input.dateStart, input.timeStart, input.dateEnd, input.timeEnd);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    })
                                };
                            });
                        }
                    });

                }
            } else {
                return res.render("pages/denied.ejs", { username: req.user.firstName });
            }
        }
    });
}


function deleteClashes(user, res, input, employeeId, requestClashes, taskClashes) {
    console.log(time_now() + "assign.deleteClashes() called by user #" + user.employeeId + "(" + user.username + ")");
    for (var i = 0; i <= requestClashes.length; i++) {
        if (requestClashes[i]) {
            var deletedRequestId = requestClashes[i].requestId;
            var deletedRequestType = requestClashes[i].type;
            dbController.deleteRequest(requestClashes[i].requestId, function(err, result) {
                if (err) {
                    console.log(time_now() + err);
                    return res.render('pages/assign.ejs', { username: user.firstName, info: err });
                } else {
                    var message_text = "Your " + deletedRequestType + " request (request id #" + deletedRequestId + " was cancelled because you were assigned a " + input.type + " that clashed with it.";
                    dbController.storeMessage(user.id, employeeId, message_time(), message_text, function(err, result) {
                        if (err) {
                            console.log(time_now() + err);
                        } else {
                            console.log(time_now() + result.message);
                        }
                    });
                    console.log(time_now() + result);
                }
            });
        }
        if (i === requestClashes.length) {
            for (var j = 0; j <= taskClashes.length; j++) {
                if (taskClashes[j]) {
                    var deletedTaskId = taskClashes[j].taskId;
                    dbController.deleteTask(taskClashes[j].taskId, function(err, result) {
                        if (err) {
                            console.log(time_now() + err);
                            return res.render('pages/assign.ejs', { username: user.firstName, info: err });
                        } else {
                            var message_text = "Your task (task id # " + deletedTaskId + ")" + " was cancelled because you were assigned a " + input.type + " that clashes with it.";
                            dbController.storeMessage(user.employeeId, employeeId, message_time(), message_text, function(err, result) {
                                if (err) {
                                    console.log(time_now() + err);
                                } else {
                                    console.log(time_now() + result.message);
                                }
                            });
                        }
                    });
                }
                if (j === taskClashes.length) {
                    console.log(time_now() + requestClashes.length + " requests, and " + taskClashes.length + " tasks cancelled for user #" + employeeId);
                    storeAndRender(user, res, employeeId, input.type, input.dateStart, input.timeStart, input.dateEnd, input.timeEnd);
                }
            }
        }
    }
}

function storeAndRender(user, res, employeeId, type, dateStart, timeStart, dateEnd, timeEnd) {
    console.log(time_now() + "assign.storeAndRender() called by user #" + user.employeeId + " (" + user.username + ")");

    // Store task
    dbController.storeTask(employeeId, type, dateStart, dateEnd, timeStart, timeEnd, function(err, storeResult) {
        if (err) {
            // Show error if any and render.
            console.log(time_now() + err);
            return res.render('pages/assign', { username: user.firstName, info: err });
        } else {
            // Store message for employee.
            var message_text = "You were assigned task #" + storeResult.newTaskId + " (" + dateStart + " " + timeStart + " - " +
                dateEnd + " " + timeEnd + " by " + user.jobTitle + " " + user.firstName + " " + user.surname + " (" + user.username + ")";

            dbController.storeMessage(user.employeeId, employeeId, message_time(), message_text, function(err, result) {
                if (err) {
                    console.log(time_now() + err);
                } else {
                    console.log(time_now() + result.message);
                }
            });

            // Store message for administrator and render page for user.
            var message_text = "You assigned " + type + " #" + storeResult.newTaskId + " (" + dateStart + " " +
                timeStart + " - " + dateEnd + " " + timeEnd + ") to user #" + employeeId + ".";

            dbController.storeMessage(employeeId, user.employeeId, message_time(), message_text, function(err, result) {
                if (err) {
                    console.log(time_now() + err);
                    return res.render('pages/assign', { username: user.firstName, info: err });
                } else {
                    console.log(time_now() + result.message);
                    return res.render('pages/assign', { username: user.firstName, info: storeResult.message });
                }
            });
        }
    });
}

module.exports.get = get;
module.exports.post = post;
// Own code requirements.
const cryptoController = require("../own_modules/cryptoController.js");
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");
const moment = require("moment");

function time_now() { return "\n[" + moment().format("YYYY-MM-DD - HH:mm:ss") + "]: "; };

function message_time() { return moment().format("YYYY-MM-DD - HH:mm"); };

function get(req, res) {
    //Get role
    role = dbController.getUserRole(req.user.employeeId, function callback(err, role) {
        if (err) {
            console.log(time_now() + err);
        } else {
            // Check if role can do the action.
            permission = acl.ac.can(role).execute("create").sync().on("rota-request");
            // Continue if yes, reject if no.
            if (permission.granted) {
                getRequestListAndRender(req.user, res, " ");
            } else {
                return res.render("pages/denied.ejs", { username: req.user.firstName });
            }
        }
    });
}

function post(req, res) {
    //Get role
    role = dbController.getUserRole(req.user.employeeId, function(err, role) {
        if (err) {
            console.log(time_now() + err)
        } else {
            // Check if role can do the action.
            permission = acl.ac.can(role).execute("create").sync().on("rota-request");
            // Continue if yes, reject if no.
            if (permission.granted) {
                // Get the input from the request body.
                const input = req.body;

                var message_text = "New user request:\n\nUser: #" + req.user.employeeId + " - " + req.user.firstName + " " + req.user.surname + " (" +
                    req.user.username + ")\nType: " + input.type + " request \nStart date/time: " + input.dateStart + " - " + input.timeStart +
                    "\nEnd date/time: " + input.dateEnd + " - " + input.timeEnd;
                console.log(time_now() + message_text);
                //Create moment objects for date-time start and date-time end of the proposed request.
                const dateTimeStart = input.dateStart + " " + input.timeStart;
                const dateTimeEnd = input.dateEnd + " " + input.timeEnd;
                const momentStart = moment(dateTimeStart);
                const momentEnd = moment(dateTimeEnd);

                //Flag for invalid request (illogical times selected)
                var invalidRequest = 0;

                //Ensure request start date/time and end date/time are valid
                if (moment(momentStart).isAfter(momentEnd)) {
                    console.log(time_now() + "Invalid request: the end time must be after the start time.");
                    invalidRequest = 1;
                    getRequestListAndRender(req.user, res, "Invalid request: the end time must be after the start time.");
                }
                if (moment(momentStart).isSame(momentEnd)) {
                    console.log(time_now() + "Invalid request: the start time and end time are the same.");
                    invalidRequest = 1;
                    getRequestListAndRender(req.user, res, "Invalid request: the start time and end time are the same.");
                }

                //If the request is logically valid, proceed
                if (!invalidRequest) {
                    // Get the user's existing requests to check for clashes
                    dbController.getUserRequests(req.user.employeeId, function(err, pendingRequests) {
                        if (err) {
                            console.log(time_now() + err);
                            //Render the requests page with the error as the info message.
                            getRequestListAndRender(req.user, res, err);
                        } else {

                            //get the user's tasks to check for clashes
                            dbController.getUserTasks(req.user.employeeId, function(err, userTasks) {
                                if (err) {
                                    console.log(time_now() + err);
                                    //Render the requests page with the error as the info message.
                                    getRequestListAndRender(req.user, res, err);
                                } else {
                                    //Create vars to hold moment objects for date-time start and date-time end of the existing request.
                                    var requestDateTimeStart;
                                    var requestDateTimeEnd;

                                    //Variable to flag an invalid request
                                    var requestInvalid = 0;

                                    //Cycle through the requests and check for clashes 
                                    console.log(time_now() + "Checking user's pending requests for clashes..");
                                    for (var i = 0; i <= pendingRequests.length; i++) {
                                        //Only try to check the request if the next index is not empty
                                        if (pendingRequests[i]) {
                                            //Create moment objects for the existing request
                                            requestDateTimeStart = pendingRequests[i].dateStart + " " + pendingRequests[i].timeStart;
                                            requestDateTimeEnd = pendingRequests[i].dateEnd + " " + pendingRequests[i].timeEnd;
                                            requestMomentStart = moment(requestDateTimeStart);
                                            requestMomentEnd = moment(requestDateTimeEnd);

                                            //If the start date of the user's request is the same as the start or end date of an existing request, or lies between the start and end date of an existing request, or covers the entire duration of an existing request
                                            if (moment(momentStart).isBetween(requestMomentStart, requestMomentEnd) === true ||
                                                moment(momentEnd).isBetween(requestMomentStart, requestMomentEnd) === true ||
												moment(requestMomentStart).isBetween(momentStart, momentEnd) === true ||
                                                moment(momentStart).isSame(requestMomentStart) === true ||
                                                moment(requestMomentEnd) === true ||
                                                moment(momentEnd).isSame(requestMomentStart) === true) {
													//Mark the request as invalid.
													requestInvalid = 1;
													console.log(time_now() + "Invalid request - clash found with request #" + pendingRequests[i].requestId);
													getRequestListAndRender(req.user, res, "Invalid request: you already have a pending shift or holiday request for that date/time range.");
													break;
                                            }
                                        }
                                        if (i === pendingRequests.length) {
                                            console.log(time_now() + "Checked " + i + "requests for user #" + req.user.employeeId + ", no clashes detected.");
                                            //Repeat the same procedure for the user's tasks.
                                            console.log(time_now() + "Checking user's existing tasks for clashes..");
                                            for (var j = 0; j <= userTasks.length; j++) {
                                                if (userTasks[j]) {
                                                    //Create moment object for the existing task
                                                    taskDateTimeStart = userTasks[j].dateStart + " " + userTasks[j].timeStart;
                                                    taskDateTimeEnd = userTasks[j].dateEnd + " " + userTasks[j].timeEnd;
                                                    taskMomentStart = moment(taskDateTimeStart);
                                                    taskMomentEnd = moment(taskDateTimeEnd);
                                                
													if (moment(momentStart).isBetween(taskMomentStart, taskMomentEnd) === true ||
														moment(momentEnd).isBetween(taskMomentStart, taskMomentEnd) === true ||
														moment(taskMomentStart).isBetween(momentStart, momentEnd) === true ||
														moment(momentStart).isSame(taskMomentStart) === true ||
														moment(taskMomentEnd) === true ||
														moment(momentEnd).isSame(taskMomentStart) === true) {
															//Mark the request as invalid.
															requestInvalid = 1;
															console.log(time_now() + "Invalid request - clash found with existing task #" + userTasks[j].taskId);
															getRequestListAndRender(req.user, res, "Invalid request: you already have a " + userTasks[j].type + " for that date/time range.");
															break;
													};
												}
                                                if (j === userTasks.length) {
                                                    console.log(time_now() + "Checked " + j + " tasks for user #" + req.user.employeeId + ", no clashes detected.");

                                                }
                                            }

                                            if (!requestInvalid) {
                                                dbController.storeRequest(req.user.employeeId, input.type, message_time(), input.dateStart, input.dateEnd, input.timeStart, input.timeEnd, function(err, result) {
                                                    if (err) {
                                                        getRequestListAndRender(req.user, res, err);
                                                    } else {
                                                        getRequestListAndRender(req.user, res, result.message);
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    });
                }
            } else {
                return res.render('pages/denied.ejs', { username: req.user.firstName });
            }
        }
    });
}

function getRequestListAndRender(user, res, message) {
    dbController.getUserRequests(user.employeeId, function(err, result) {
        if (err) {
            console.log(time_now() + err);
            return res.render('pages/request.ejs', { username: user.firstName, requests: " ", info: err });
        } else {
            return res.render('pages/request.ejs', { username: user.firstName, requests: result, info: message });
        }
    });
}

module.exports.get = get;
module.exports.post = post;
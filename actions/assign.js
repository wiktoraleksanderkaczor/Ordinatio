// Own code requirements.
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");
const moment = require("moment");


function get(req, res) {
	
	//Get role
	role = dbController.getUserRole(req.user.employeeId, function callback(err, role) {
		if (err) {
			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("assign").sync().on("schedule");
			
			// Continue if yes, reject if no.
			if (permission.granted) {	
				return res.render("pages/assign.ejs", { info: "" });
			}
			else {
				return res.render("pages/denied.ejs", { username: req.user.firstName });
			}
		}
    });
}

function post(req, res) {
	//Get role
	dbController.getUserRole(req.user.employeeId, function callback(err, role) {
		if (err) {
			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err)
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("assign").sync().on("schedule");
			// Continue if yes, reject if no.
			if (permission.granted) {	
				
				// Get the input from the request body.
				const input = req.body;
				console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "New " + input.type + " assignment for user #" + input.employeeId + " - " + input.dateStart + " " + input.timeStart + " - " + input.dateEnd + " " + input.timeEnd);
				
				//create moment objects for the date/time start and date/time end of the request.
				
				const dateTimeStart = input.dateStart + " " + input.timeStart;
				const dateTimeEnd = input.dateEnd + " " + input.timeEnd;
				const momentStart = moment(dateTimeStart).format("YYYY-MM-DDTHH:mm:ssZ");
				const momentEnd = moment(dateTimeEnd).format("YYYY-MM-DDTHH:mm:ssZ");
				const momentDateStart = moment(input.dateStart).format("YYYY-MM-DDTHH:mm:ssZ");
				const momentDateEnd = moment(input.dateEnd).format("YYYY-MM-DDTHH:mm:ssZ");
				
				console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checking assignment is valid..");
				
				//Flag to indicate a logically invalid assignment
				var invalidAssignment = 0;
				
				//Ensure request start date/time and end date/time are valid
				if(moment(momentStart).isAfter(momentEnd)) {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Invalid request: the shift end time must be after the shift start time.");
					invalidAssignment = 1;
					return res.render('pages/assign.ejs', { username: req.user.firstName, info:  "Invalid request: the shift end time must be after the shift start time." } );
				}
				if(moment(momentStart).isSame(momentEnd)) {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Invalid request: the shift start time and end time are the same.");
					invalidAssignment = 1;
					return res.render('pages/assign.ejs', { username: req.user.firstName, info: "Invalid request: the shift start time and end time are the same." });
				}
				
				//If assignment is logically valid, proceed to check for clashes 
				if(!invalidAssignment) {
				
					// Get the user's existing requests to check for clashes
					dbController.getUserRequests(input.employeeId, function (err, pendingRequests) {
						if(err) {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
							
							//Render the requests page with the error as the info message.
							storeAndRender(req, res, err);
						}
						else {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  pendingRequests.length + " requests found for user #" + input.employeeId);
							
							//get the user's shifts to check for clashes
							dbController.getUserShifts(input.employeeId, function (err, userShifts) {
								if(err) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
									
									//Render the requests page with the error as the info message.
									storeAndRender(req, res, err);
								}
								else {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  userShifts.length + " existing shifts found for user #" + input.employeeId);
									
									//Get the user's holidays to check for clashes
									dbController.getUserHolidays(input.employeeId, function (err, userHolidays) {
										if(err) {
											console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
											
											//Render the requests page with the error as the info message.
											storeAndRender(req, res, err);
										}
										else {
											console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  userHolidays.length + "existing holidays found for user #" + input.employeeId);
											
											//Create vars to hold moment objects for date-time start and date-time end of the existing request.
											var pendingRequestDateTimeStart;
											var pendingRequestDateTimeEnd;
											var userShiftDateTimeStart;
											var userShiftDateTimeEnd;
											var userHolidayDateStar;
											var userHolidayDateEnd;
											
											//arrays to delete clashing shifts/requests/holidays
											var requestClashes = [];
											var shiftClashes = [];
											var holidayClashes = [];
											
											//Cycle through the requests and check for clashes 
											console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checking user's pending requests for clashes..")
											for(var i = 0; i <= pendingRequests.length; i++) {
												
												//Only try to check the request if the next index is not empty
												if(pendingRequests[i]) {
													
													//Create moment objects for the existing request
													pendingRequestDateTimeStart = pendingRequests[i].dateStart + " " + pendingRequests[i].timeStart; 
													pendingRequestDateTimeEnd = pendingRequests[i].dateEnd + " " + pendingRequests[i].timeEnd;
													pendingRequestMomentStart = moment(pendingRequestDateTimeStart).format("YYYY-MM-DDTHH:mm:ssZ");
													pendingRequestMomentEnd = moment(pendingRequestDateTimeEnd).format("YYYY-MM-DDTHH:mm:ssZ");
												
													//If the start date of the user's request is the same as the start or end date of an existing request, or lies between the start and end date of an existing request..
													if(moment(momentStart).isBetween(pendingRequestMomentStart, pendingRequestMomentEnd) === true|| moment(momentEnd).isBetween(pendingRequestMomentStart, pendingRequestMomentEnd) === true || 
													moment(momentStart).isSame(pendingRequestMomentStart) === true || moment(momentEnd).isSame(pendingRequestMomentStart) === true || moment(momentStart).isSame(pendingRequestMomentEnd) === true || moment(momentEnd).isSame(pendingRequestMomentEnd) === true 
													|| moment(pendingRequestMomentStart).isBetween(momentStart, momentEnd) === true || moment(pendingRequestMomentEnd).isBetween(momentStart, momentEnd)) {
													
														
														//add to list of clashing requests
														console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Clash detected with an existing user request (request id #" + pendingRequests[i].requestId + ").");
														requestClashes.push(pendingRequests[i]);
													}
												}
												if(i === pendingRequests.length) {
													console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checked " + i + " requests for user #" + input.employeeId + ", " + requestClashes.length + " clashes detected.");
													
													//Repeat the same procedure for the user's shifts.
													console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checking user's existing shifts for clashes..");
													for(var j = 0; j <= userShifts.length; j++) {
														if(userShifts[j]) {	
															
															//Create moment object for the existing shift
															userShiftDateTimeStart = userShifts[j].dateStart + " " + userShifts[j].timeStart; 
															userShiftDateTimeEnd = userShifts[j].dateEnd + " " + userShifts[j].timeEnd;
															userShiftMomentStart = moment(userShiftDateTimeStart).format("YYYY-MM-DDTHH:mm:ssZ");
															userShiftMomentEnd = moment(userShiftDateTimeEnd).format("YYYY-MM-DDTHH:mm:ssZ");
															if(moment(momentStart).isBetween(userShiftMomentStart, userShiftMomentEnd) === true || moment(momentEnd).isBetween(userShiftMomentStart, userShiftMomentEnd) === true 
															|| moment(momentStart).isSame(userShiftMomentStart) === true || moment(momentStart).isSame(userShiftMomentEnd) === true || moment(momentEnd).isSame(userShiftMomentStart) === true || 
															moment(momentEnd).isSame(userShiftMomentEnd) === true || moment(userShiftMomentStart).isBetween(momentStart, momentEnd) === true || moment(userShiftMomentEnd).isBetween(momentStart, momentEnd) === true) {
																
																//If auto-cancel box was checked, add the shift to to the list of clashing shifts.
																if(input.autoCancel) {
																	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Clash detected with an existing shift (shift id: # " + userShifts[j].shiftId + ").");
																	shiftClashes.push(userShifts[j]);
																}
																else {
																	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  "Invalid assignment - clash detected with shift #" + userShifts[j].shiftId + " consider cancelling that shift first.");
																	return res.render('pages/assign.ejs', { username: req.user.firstName, info: "Invalid assignment - clash detected with shift #" + userShifts[j].shiftId + " consider cancelling that shift first." });
																}
															}
														}
														if(j === userShifts.length) {
															console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checked " + j + " shifts for user #" + input.employeeId + ", " + shiftClashes.length + " clashes detected.");
															
															//Same for holidays
															console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checking user's existing holidays for clashes..");
															for(var k = 0; k <= userHolidays.length; k++) {
																if(userHolidays[k]) {
																	
																	//Create moment object for the existing holiday
																	userHolidayMomentStart = moment(userHolidays[k].dateStart).format("YYYY-MM-DDTHH:mm:ssZ");
																	userHolidayMomentEnd = moment(userHolidays[k].dateEnd).format("YYYY-MM-DDTHH:mm:ssZ");
																	if(moment(momentStart).isBetween(userHolidayMomentStart, userHolidayMomentEnd)  === true  || moment(momentEnd).isBetween(userHolidayMomentStart, userHolidayMomentEnd)  === true ||
																	moment(momentStart).isSame(userHolidayMomentStart)  === true || moment(momentEnd).isSame(userHolidayMomentStart)  === true  || moment(momentStart).isSame(userHolidayMomentEnd) === true ||
																	moment(momentEnd).isSame(userHolidayMomentEnd) === true || moment(userHolidayMomentStart).isBetween(momentStart, momentEnd) === true || moment(userHolidayMomentEnd).isBetween(momentStart, momentEnd) === true) {
																	
																		if(input.autoCancel) {
																			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Clash detected with an existing holiday (holiday id: #" + userHolidays[k].holidayId + ").");
																			holidayClashes.push(userHolidays[k]);
																		}
																		else {
																			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  "Invalid assignment - clash detected with holiday #" + userHolidays[k].holidayId + " consider cancelling that holiday first.");
																			return res.render('pages/assign.ejs', { username: req.user.firstName, info: "Invalid assignment - clash detected with holiday #" + userHolidays[k].holidayId + " consider cancelling that holiday first."});
																		}
																	}
																}
																if(k === userHolidays.length) {
																	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  "checked " + k + "holidays for user #" + input.employeeId + ", " + holidayClashes.length + " clashes detected.");
																	
																	if((input.autoCancel && (shiftClashes.length || holidayClashes.length)) || requestClashes.length) {
																		deleteClashes(req, res, input, requestClashes, shiftClashes, holidayClashes);
																	}
																	else {
																		storeAndRender(req, res, input.employeeId, input.type, input.dateStart, input.timeStart, input.dateEnd, input.timeEnd);
																	}
																}
															}
														}
													}
												}
											}
										}
									});	
								}
							});
						}
					});
				}
			}
			else {
				return res.render("pages/denied.ejs", { username: req.user.firstName });
			}
		}
	});
}

function deleteClashes(req, res, input, requestClashes, shiftClashes, holidayClashes) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "assign.deleteClashes() called by user #" + req.user.employeeId + "(" + req.user.username + ")");
	for(var i = 0; i <= requestClashes.length; i++) {
		if(requestClashes[i]) {
			var deletedRequestId = requestClashes[i].requestId;
			var deletedRequestType = requestClashes[i].type;
			dbController.deleteRequest(requestClashes[i].requestId, function (deleteRequestErr, deleteRequestResult) {
				if (deleteRequestErr) {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: deleteRequestErr:" +  deleteRequestErr);
					return res.render('pages/assign.ejs', { username: req.user.firstName, info: deleteRequestErr });
				}
				else {
					dbController.storeMessage(req.user.id, input.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "Your " + deletedRequestType
					+ " request (request id #" + deletedRequestId + " was cancelled because you were assigned a " + input.type + " that clashed with it.", function(requestCancelMessageErr, requestCancelMessageResult) {
						if(requestCancelMessageErr) {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: requestCancelMessageErr: " + requestCancelMessageErr);
						}
						else {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: requestCancelMessageResult: " + requestCancelMessageResult.message);
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + deletedRequestType + " request #" + deletedRequestId + " clashed with the new " 
							+ input.type + " assignment, so it was removed from the database.");
						}
					});
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  deleteRequestResult);
				}
			});
		}
		if(i === requestClashes.length) {
			for(var j = 0; j <= shiftClashes.length; j++) {
				if(shiftClashes[j]) {
					var deletedShiftId = shiftClashes[j].shiftId;
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: @assign.js/254: " + deletedShiftId);
					dbController.deleteShift(shiftClashes[j].shiftId, function (deleteShiftErr, deleteShiftResult) {
						if(deleteShiftErr) {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: deleteShiftErr:" +  deleteShiftErr);
							return res.render('pages/assign.ejs', { username: req.user.firstName, info: deleteShiftErr });
						}
						else {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  "Shift #" + deletedShiftId + " clashed with the new " + input.type + ", so it was removed from the database.");
							dbController.storeMessage(req.user.employeeId, input.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "Your shift (shift id # " + deletedShiftId + ")" +
							+ " was cancelled because you were assigned a " + input.type + " that clashes with it.", function (cancelShiftMessageErr, cancelShiftMessageResult) {
								if(cancelShiftMessageErr) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: cancelShiftMessageErr: " +  cancelShiftMessageErr);
								}
								else {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: cancelShiftMessageResult " +  cancelShiftMessageResult.message);
								}
							});
						}
					});
				}
				if(j === shiftClashes.length) {
					for(var k = 0; k <= holidayClashes.length; k++) {
						if(holidayClashes[k]) {
							var deletedHolidayId = holidayClashes[k].holidayId;
							dbController.deleteHoliday(holidayClashes[k].id, function (deleteHolidayErr, deleteHolidayResult) {
								if(deleteHolidayErr) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: deleteHolidayErr: " + deleteHolidayErr);
									return res.render('pages/assign.ejs', { username: req.user.firstName, info: "deleteHolidayErr: " + deleteHolidayErr } );
								}
								else {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: deleteHolidayResult: " + JSON.stringify(deleteHolidayResult));
									dbController.storeMessage(req.user.employeeId, input.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "Your holiday (holiday id# " + deletedHolidayId + " was cancelled because you were assigned a " 
									+ input.type + " that clashed with it.", function(deleteHolidayMessageErr, deleteHolidayMessageResult) {
										if(deleteHolidayMessageErr) {
											console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: deleteHolidayMessageErr: " + deleteHolidayMessageErr);
										} 
										else {
											console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: deleteHolidayMessageResult: " + deleteHolidayMessageResult.message);
										}
									});
								}
							});
						}
						if(k === holidayClashes.length) {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + requestClashes.length + " requests, " + shiftClashes.length + " shifts, and " + holidayClashes.length + " holidays cancelled for user #" + input.employeeId);
							storeAndRender(req, res, input.employeeId, input.type, input.dateStart, input.timeStart, input.timeEnd);
						}
					}
				}
			}
		}
	}
}

function storeAndRender(req, res, employeeId, type, dateStart, timeStart, dateEnd, timeEnd) {
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: assign.storeAndRender() called by user #" + req.user.employeeId + " (" + req.user.username + ")");
	switch(type) {
		
		case "Shift":
		
			dbController.storeShift(employeeId, dateStart, dateEnd, timeStart, timeEnd, function (err, storeShiftResult) {
				if(err) {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
					return res.render('pages/assign', { username: req.user.firstName, info: err });
				}
				else {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: storeShiftResult: " + storeShiftResult.message);
					dbController.storeMessage(req.user.employeeId, employeeId, moment().format("YYYY-MM-DD - HH:mm"), "You were assigned shift #" + storeShiftResult.newShiftId + " (" + 
					dateStart + " " + timeStart + " - " + dateEnd + " " + timeEnd + " by " + req.user.jobTitle + " " + req.user.firstName + " " + req.user.surname + " (" + req.user.username + ")",  function (err, storeEmployeeMessageResult) {
						if(err) {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
						}
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  storeEmployeeMessageResult.message);
							dbController.storeMessage(employeeId, req.user.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "You assigned shift #" + storeShiftResult.newShiftId + " (" + 
							dateStart + " " + timeStart + " - " + dateEnd + " " + timeEnd + ") to user " + employeeId + ".", function (storeAdminMessageErr, storeAdminMessageResult) {
								if(err) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
									return res.render('pages/assign', { username: req.user.firstName, info: storeAdminMessageErr });
								}
								else {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  storeAdminMessageResult.message);
									return res.render('pages/assign', { username: req.user.firstName, info: storeShiftResult.message });
								}
							});
						
					});
				}
			});
			break;
		case "Holiday":
			dbController.storeHoliday(req, res, employeeId, dateStart, dateEnd, function (err, storeHolidayResult) {
				if(err) {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
					return res.render('pages/assign', { username: req.user.FirstName, info: err });
				}
				else {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: storeHolidayResult: " + storeHolidayResult.message);
					dbController.storeMessage(req.user.employeeId, employeeId, moment().format("YYYY-MM-DD - HH:mm"), "You were assigned holiday #" + storeHolidayResult.newholidayId + " (" + 
					dateStart + " " + timeStart + " - " + dateEnd + " " + timeEnd + " by " + req.user.jobTitle + " " + req.user.firstName + " " + req.user.surname + " (" + req.user.username + ")",  function (err, storeEmployeeMessageResult) {
						if(err) {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
						}
						
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  JSON.stringify(storeEmployeeMessageResult));
							dbController.storeMessage(employeeId, req.user.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "You assigned holiday #" + storeHolidayResult.newholidayId + " (" + 
							dateStart + " " + timeStart + " - " + dateEnd + " " + timeEnd + ") to user " + employeeId + ".", function (storeAdminMessageErr, storeAdminMessageResult) {
								if(err) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
									return res.render('pages/assign', { username: req.user.firstName, info: storeAdminMessageErr });
								}
								else {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  JSON.stringify(storeAdminMessageResult));
									return res.render('pages/assign', { username: req.user.firstName, info: storeHolidayResult.message });
								}
							});
					});
				}
			});
			break;
	}
}
				
module.exports.get = get;
module.exports.post = post;
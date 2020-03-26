// Own code requirements.
const cryptoController = require("../own_modules/cryptoController.js");
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
			permission = acl.ac.can(role).execute("create").sync().on("rota-request");
			// Continue if yes, reject if no.
			if (permission.granted) {	
				getRequestListAndRender(req, res, " ");
			}
			else {
				return res.render("pages/denied.ejs", { username: req.user.firstName });
			}
		}
	});
}

function post(req, res) {
	//Get role
	role = dbController.getUserRole(req.user.employeeId, function (err, role) {
		if (err) {
			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err)
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("create").sync().on("rota-request");
			// Continue if yes, reject if no.
			if (permission.granted) {	
                // Get the input from the request body.
                const input = req.body;
				
				console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "New user request:\n\nUser: #" + req.user.employeeId + " - " + req.user.firstName + " " + req.user.surname + " (" + req.user.username + ")\nType: " + input.type + " request \nStart date/time: " + input.dateStart + " - " + input.timeStart + 
				"\nEnd date/time: " + input.dateEnd + " - " + input.timeEnd);
				//Create moment objects for date-time start and date-time end of the proposed request.
				const dateTimeStart = input.dateStart + " " + input.timeStart;
				const momentStart = moment(dateTimeStart).format("YYYY-MM-DDTHH:mm:ssZ");
				const dateTimeEnd = input.dateEnd + " " + input.timeEnd;
				const momentEnd = moment(dateTimeEnd).format("YYYY-MM-DDTHH:mm:ssZ");
				const momentDateStart = moment(input.dateStart).format("YYYY-MM-DDTHH:mm:ssZ");
				const momentDateEnd = moment(input.dateEnd).format("YYYY-MM-DDTHH:mm:ssZ");
				
				//Flag for invalid request (illogical times selected)
				var invalidRequest = 0;
				
				//Ensure request start date/time and end date/time are valid
				if(moment(momentStart).isAfter(momentEnd)) {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Invalid request: the shift end time must be after the shift start time.");
					invalidRequest = 1;
					getRequestListAndRender(req, res, "Invalid request: the shift end time must be after the shift start time.");
				}
				if(moment(momentStart).isSame(momentEnd)) {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Invalid request: the shift start time and end time are the same.");
					invalidRequest = 1;
					getRequestListAndRender(req, res, "Invalid request: the shift start time and end time are the same.");
				}
				
				//If the request is logically valid, proceed
				if(!invalidRequest) {
					
					// Get the user's existing requests to check for clashes
					dbController.getUserRequests(req.user.employeeId, function (err, pendingRequests) {
						if(err) {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
							//Render the requests page with the error as the info message.
							getRequestListAndRender(req, res, err);
						}
						else {
							
							//get the user's shifts to check for clashes
							dbController.getUserShifts(req.user.employeeId, function (err, userShifts) {
								if(err) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
									//Render the requests page with the error as the info message.
									getRequestListAndRender(req, res, err);
								}
								else {
									
									//Get the user's holidays to check for clashes
									dbController.getUserHolidays(req.user.employeeId, function (err, userHolidays) {
										if(err) {
											console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
											//Render the requests page with the error as the info message.
											getRequestListAndRender(req, res, err);
										}
										else {
										
											//Create vars to hold moment objects for date-time start and date-time end of the existing request.
											var pendingRequestDateTimeStart;
											var pendingRequestDateTimeEnd;
											var userShiftDateTimeStart;
											var userShiftDateTimeEnd;
											var userHolidayDateStar;
											var userHolidayDateEnd;
											
											//Variable to flag an invalid request
											var requestInvalid = 0;
											
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
													if(moment(momentStart).isBetween(pendingRequestMomentStart, pendingRequestMomentEnd) === true|| moment(momentEnd).isBetween(pendingRequestMomentStart, pendingRequestMomentEnd) === true || moment(momentStart).isSame(pendingRequestMomentStart) === true || moment(pendingRequestMomentEnd) === true || moment(momentEnd).isSame(pendingRequestMomentStart)) {
														//Mark the request as invalid, mark the requestschecked flag and the request clash flag.
														requestInvalid = 1;
														console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Invalid request - clash found with request #" + pendingRequests[i].requestId);
														getRequestListAndRender(req, res, "Invalid request: you already have a pending shift or holiday request for that date/time range.");
														break;
													}
												}
												if(i === pendingRequests.length) {
													console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checked " + i + "requests for user #" + req.user.employeeId + ", no clashes detected.");
													//Repeat the same procedure for the user's shifts.
													console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checking user's existing shifts for clashes..");
													for(var j = 0; j <= userShifts.length; j++) {
														if(userShifts[j]) {	
															//Create moment object for the existing shift
															usershiftDateTimeStart = userShifts[j].dateStart + " " + userShifts[j].timeStart; 
															usershiftDateTimeEnd = userShifts[j].dateEnd + " " + userShifts[j].timeEnd;
															usershiftMomentStart = moment(usershiftDateTimeStart).format("YYYY-MM-DDTHH:mm:ssZ");
															usershiftMomentEnd = moment(usershiftDateTimeEnd).format("YYYY-MM-DDTHH:mm:ssZ");
															if(moment(momentStart).isBetween(usershiftMomentStart, usershiftMomentEnd) === true || moment(momentEnd).isBetween(usershiftMomentStart, usershiftMomentEnd) === true || moment(momentStart).isSame(usershiftMomentStart) === true || moment(usershiftMomentEnd) === true || moment(momentEnd).isSame(usershiftMomentStart) === true) {
																requestInvalid = 1;
																console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Invalid request - clash found with existing shift #" + userShifts[j].shiftId);
																getRequestListAndRender(req, res, "Invalid request: you already have a shift for that date/time range.");
																break;
															}
														}
														if(j === userShifts.length) {
															console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checked " + j + " shifts for user #" + req.user.employeeId + ", no clashes detected.");
															//Same for holidays
															console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checking user's existing holidays for clashes..");
															for(var k = 0; k <= userHolidays.length; k++) {
																if(userHolidays[k]) {
																	//Create moment object for the existing holiday
																	userholidayMomentStart = moment(userholidays[k].dateStart).format("YYYY-MM-DDTHH:mm:ssZ");
																	userholidayMomentEnd = moment(userholidays[k].dateEnd).format("YYYY-MM-DDTHH:mm:ssZ");
																	if(moment(momentStart).isBetween(userholidayMomentStart, userholidayMomentEnd)  === true  || moment(momentEnd).isBetween(userholidayMomentStart, userholidayMomentEnd)  === true || moment(momentStart).isSame(userholidayMomentStart)  === true || moment(userholidayMomentEnd)  === true  || moment(momentEnd).isSame(userholidayMomentStart) === true) {
																		requestInvalid = 1;
																		console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Invalid request, clash found with existing holiday #" + userHolidays[k]);
																		getRequestListAndRender(req, res, "Invalid request: you already have a holiday for that date/time range.");
																		break;
																	}
																}
																if(k === userHolidays.length) {
																	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "Checked " + k + " holidays for user #" + req.user.employeeId + ", no clashes detected.");
																	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + "All pending requests, shifts and holidays checked for user #" + req.user.employeeId + ", no clashes detected.");
																	if(!requestInvalid) {
																		dbController.storeRequest(req.user.employeeId, input.type, moment().format("YYYY-MM-DD - HH:mm:ss"), input.dateStart, input.dateEnd,input.timeStart, input.timeEnd, function (err, result) {
																			if(err) {
																				getRequestListAndRender(req, res, err);
																			}
																			else {
																				getRequestListAndRender(req, res, result.message);
																			}
																		});
																	}
																}
																break;
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
				return res.render('pages/denied.ejs', { username: req.user.firstName });
			}
		}
	});
}

function getRequestListAndRender(req, res, message) {
	dbController.getUserRequests(req.user.employeeId, function (err, result) {
		if(err) {
			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
			return res.render('pages/request.ejs', { username: req.user.firstName, requests: " ", info: err } );
		}
		else {
			return res.render('pages/request.ejs', { username: req.user.firstName, requests : result, info: message });
		}
	});
}

module.exports.get = get;
module.exports.post = post;
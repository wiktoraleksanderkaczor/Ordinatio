//Module requirements
const moment = require("moment");
const path = require('path');

// Own code requirements.
const dbController = require("../own_modules/dbController.js");

function post(req, res) {
	//check if user has the appropriate role to accept a request
	dbController.getUserRole(req.user.employeeId, function (err, role) {
		if(err) {
			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
		}
		else {
			//if user is admin or root, retrieve the appropriate request from db
			if(role === "root" || role === "admin") {
				console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  req.query);
				dbController.getRequest(req.query.requestId, function (err, request) {
					if(err) {
						console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
					}
					else {
						//Add the request as either a shift or holiday then delete the request
						if(request.type === "shift") {
								dbController.storeShift(request.employeeId, request.dateStart, request.dateEnd, request.timeStart, request.timeEnd, function (err, result) { 
									if(err) {
										console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
									}
									else {
										
										//Store a message for the employee who requested the shift, informing them the request was approved.
										dbController.storeMessage(req.user.employeeId, request.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "Your shift request (request id: " + request.requestId + ") was approved.", function(err, result) {
											if(err) {
												console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
											} 
											else {
												console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
												
												//Store a message for the admin stating that they approved the employee's request.
												dbController.storeMessage(req.user.employeeId, req.user.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "You approved shift request #" + request.requestId + " for employee #"+ request.employeeId + " - " + request.firstName + " " + request.surname + " (" + request.username + ")", function (err, result) {
													if(err) {
														console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
													}
													else {
														console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
														
														//Delete the request from the requests table
														dbController.deleteRequest(request.requestId, function (err, result) {
															if(err) {
																console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
															}
															else {
																console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
															}
														});
													}
												});
													
											}
										});
									}
								});
						}	
						else {
							//Store the new holiday in holidays table
							dbController.storeHoliday(request.employeeId, request.dateStart, request.dateEnd, function (err, result) { 
								//Store a new message for the employee telling them their holiday was approved
								dbController.storeMessage(req.user.employeeId, request.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "Your holiday request (request id: " + request.requestId + ") was approved.", function (err, result) {
									if(err) {
										console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
									}
									else {
										console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
										//store a new message for the admin telling them they approved the holiday
										dbController.storeMessage(req.user.employeeId, req.user.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "You approved holiday request #" + request.requestId + " for employee #" + request.employeeId + " - " + request.firstName + " " + request.surname + " (" + request.username + ")", function (err, result) {
											if(err) {
												console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
											}
											else {
												console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
												//Delete the holiday request from requests table
												dbController.deleteRequest(request.requestId, function (err, result) {
													if(err) {
														console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
													}
													else {
														console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
													}
												});
											}
										});
									}
								});
								
								if(err) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
								}
								else {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
									
								}
							});
						}
				}});
			res.redirect('/main');
			} else {
				return res.render('pages/denied.ejs', {username: req.user.firstName});
			}
		}
	});
}

function get(req, res) {
	res.redirect('/main');
}

module.exports.get = get;
module.exports.post = post;
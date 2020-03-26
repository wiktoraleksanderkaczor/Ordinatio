// Module requirements
const path = require("path");
const moment = require('moment');

// Own code requirements
const dbController = require("../own_modules/dbController.js");

function post(req, res) {
	//check if user has the appropriate role to accept a request
	console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  req.query);
	dbController.getUserRole(req.user.employeeId, function (err, role) {
		if(err) {
			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
		}
		else {
			//retrieve the request from the dbController
			dbController.getRequest(req.query.requestId, function (err, request) {
				if(err) {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
				}
				else {
					console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  request);
					//if the user is root or admin, OR if the request was made by the logged in user, allow them to cancel/reject it 
					if(role === "root" || role === "admin" || req.user.employeeId === request.employeeId) {
						
						//if user is admin or root...
						if(role === "root" || role === "admin") {
							
								//Store a message for the admin stating that they rejected the employees request 
								dbController.storeMessage(req.user.employeeId, req.user.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "You rejected " + request.type + " request #" + request.requestId + " for employee #" + request.employeeId + " - " + request.firstName + " " + request.surname + " (" + request.username + ").", function (err, result) {
									if(err) {
										console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
									}
									else {
										console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
										
										//then store a message for the employee stating that their request was cancelled
										dbController.storeMessage(req.user.employeeId, request.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "Your " + request.type + " request (request #" + request.requestId + ") was rejected.", function (err, result) {
											if(err) {
												console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
											}
											else {
												console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
												
												//delete the request from the requests table
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
						
						//If the user is the employee who made the request...
						else {
							
								//store a message for that employee stating that they cancelled their request.
								dbController.storeMessage(req.user.employeeId, req.user.employeeId, moment().format("YYYY-MM-DD - HH:mm"), "You cancelled " + request.type + " request #" + request.requestId + ".", function (err, result) {
									if(err) {
										console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
									}
									else {
										console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
										
										//delete the request from the requests table.
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
					}
					else {
						return res.render('pages/denied.ejs', { username: req.user.firstNam });
					}
				}
			});
			//Otheriwse, redirect to denied page.
		} 
	});
	res.redirect('/main');
}


function get(req, res) {
	
}
module.exports.post = post;
module.exports.get = get;
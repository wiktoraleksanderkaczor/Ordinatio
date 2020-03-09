// Own code requirements.
const dbController = require("../own_modules/dbController.js");
const path = require('path');

function post(req, res) {
	//check if user has the appropriate role to accept a request
	dbController.getUserRole(req.user.id, function (err, role) {
		if(err) {
			console.log(err);
		}
		else {
			//if user is admin or root, retrieve the appropriate request from db
			if(role === "root" || role === "admin") {
				console.log(req.query);
				dbController.getRequest(req.query.requestId, function (err, request) {
					if(err) {
						console.log(err);
					}
					else {
						//Add the request as either a shift or holiday then delete the request
						switch(request.type) {
							case "Shift": 
								dbController.storeShift(request.employeeId, request.dateTimeStart, request.dateTimeEnd, function (err, result) { 
									if(err) {
										console.log(err);
										console.log(result);
									}
									else {
										console.log(result);
										dbController.deleteRequest(request.requestId, function (err, result) {
											if(err) {
												console.log(err);
											}
											else {
												console.log(result);
											}
										});
									}
								});
								break;
							case "Holiday":
									dbController.storeHoliday(request.employeeId, request.dateTimeStart, request.dateTimeEnd, function (err, result) { 
										if(err) {
											console.log(err);
										}
										else {
											console.log(result);
											dbController.deleteRequest(request.requestId, function (err, result) {
												if(err) {
													console.log(err);
												}
												else {
													console.log(result);
												}
											});
										}
									});
									break;
						};
					}
				});
			res.redirect('/main');
			} else {
				res.render('pages/denied.ejs', {username: req.user.firstName});
			}
		}
	});
}

function get(req, res) {
	res.redirect('/main');
}

module.exports.get = get;
module.exports.post = post;
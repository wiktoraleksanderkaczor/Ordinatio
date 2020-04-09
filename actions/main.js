//Module requirements
const moment = require("moment");

// Own code requirements.
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");



function time_now() { return "\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: "; };

function get(req, res) {
    //Get role
    role = dbController.getUserRole(req.user.employeeId, function callback(err, role) {
        if (err) {
            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
        } 
		else {
			// Check if role can do the action.
            permission = acl.ac.can(role).execute("view").sync().on("schedule");
            // Continue if yes, reject if no.
            if (permission.granted) {
				
				//Set up response object with default values.
				var responseObject = { 
					info: "",
					username: req.user.firstName,
					shifts: "",
					requests: "",
					messages: "",
					holidays: "",
					userObj: req.user
				}
				
				//Check if user is root or admin so admin main page can be rendered.
				if (role === "root" || role === "admin") {
					
					//Get all outstanding requests on the system
					dbController.getAllRequests(function(err, requestResults) {
						
						//If error, render page with error message as info
						if (err) {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
							responseObject.info = err;
							return res.render('pages/main-admin.ejs', responseObject);
						} 
						else {
							responseObject.requests = requestResults;
							//Get all the user's messages to display 
							dbController.getUserMessages(req.user.employeeId, function(err, messageResults) {
								if (err) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
										responseObject.info = err;
										return res.render('pages/main-admin.ejs', responseObject);
									} 
									else {
										responseObject.messages = messageResults;
										dbController.getAllShifts(function (err, shiftResults) {
											if(err) {
												console.log(time_now() + "Error getting shifts: " + err);
												responseObject.info = err;
												return res.render('pages/main-admin.ejs', responseObject);
											}
											else {
												responseObject.shifts = shiftResults;
												dbController.getAllHolidays(function (err, holidayResults) {
													if(err) {
														console.log(time_now() + "Error getting holidays: " + err);
														responseObject.info = err;
														return res.render('pages/main-admin.ejs', responseObject);
													}
													else {
														responseObject.holidays = holidayResults;
														return res.render('pages/main-admin.ejs', responseObject);
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
						dbController.getUserMessages(req.user.employeeId, function(err, messageResults) {
							if (err) {
								console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
								responseObject.info = err;
								return res.render('pages/main.ejs', responseObject);
							} 
							else {
								responseObject.messages = messageResults;
								return res.render('pages/main.ejs', responseObject);
							}
						});
				}
            }
			else {
				return res.render('pages/denied.ejs', responseObject);
			}
		}
	});
}




module.exports.get = get;
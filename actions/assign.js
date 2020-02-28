// Own code requirements.
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");


function get(req, res) {
	//Get role
	role = dbController.getUserRole(req.user.username, function callback(err, role) {
		if (err) {
			console.log(err);
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("assign").sync().on("schedule");
			// Continue if yes, reject if no.
			if (permission.granted) {	
				res.render("pages/assign.ejs", { info: "" });
			}
			else {
				res.render("pages/denied.ejs", { username: req.user.username });
			}
		}
    });
}

function post(req, res) {
	//Get role
	(dbController.getUserRole(req.user.username, function callback(err, role) {
		if (err) {
			console.log(err)
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("assign").sync().on("schedule");
			// Continue if yes, reject if no.
			if (permission.granted) {	
				// Get the input from the request body.
				const input = req.body;
				const dateTimeStart = input.startDate + " " + input.startTime;
				const dateTimeEnd = input.endDate + " " + input.endTime;
				switch(input.type) {
					case "shift":
						dbController.storeShift(input.employeeId, dateTimeStart, dateTimeEnd, function (err, result) {
							if(err) {
								console.log(err);
								res.render('pages/assign', { username: req.user.FirstName, info: err });
							}
							else {
								res.render('pages/assign', { username: req.user.firstName, info: result });
							}
						});
						break;
					case "holiday":
						dbController.storeHoliday(input.employeeId, input.startDate, input.endDate, function (err, result) {
							if(err) {
								console.log(err);
								res.render('pages/assign', { username: req.user.firstName, info: err });
							}
							else {
								res.render('pages/assign', { username: req.user.firstName, info: err });
							}
						});
						break;
				}
			}
			else {
				res.render("pages/denied.ejs", { username: req.user.username });
			}
		}
    }));
}

module.exports.get = get;
module.exports.post = post;
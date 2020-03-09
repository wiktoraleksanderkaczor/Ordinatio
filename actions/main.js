// Own code requirements.
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");


function get(req, res) {
	//Get role
	role = dbController.getUserRole(req.user.id, function callback(err, role) {
		if (err) {
			console.log(err);
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("view").sync().on("schedule");
			// Continue if yes, reject if no.
			if (permission.granted) {	
				if(role === "root" || role === "admin") {
					dbController.getAllShifts(function (err, shiftresults) {
						if(err) {
							console.log(err);
							res.render('pages/main-admin.ejs', { info: err, username: req.user.firstName, shifts: "", requests: "" } );
						}
						else { 
							dbController.getAllRequests(function (err, requestResults) {
								if(err) { 
									console.log(err);
									res.render('pages/main-admin.ejs', { info: err, username: req.user.firstName, shifts: "", requests: "" } );
								}
								else {
									res.render('pages/main-admin.ejs', { info: " ", username: req.user.firstName, shifts: shiftresults, requests: requestResults });
								}
							});
						}
					});
				}
				else {
						res.render('pages/main.ejs', { info: "", username: req.user.firstName });
				}
			};
		}
	});
}
module.exports.get = get;
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
			permission = acl.ac.can(role).execute('view').sync().on('schedule');
			// Continue if yes, reject if no.
			if (permission.granted) {	
				if (role === "admin" || role === "root") {
					res.render("pages/main-admin.ejs", { username: req.user.username });
				}
				else {
					res.render("pages/main.ejs", { username: req.user.username });
				}
			}
			else {
				res.render("pages/denied.ejs", { username: req.user.username });
			}
		}
	});
}

module.exports.get = get;
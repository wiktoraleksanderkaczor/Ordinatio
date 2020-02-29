// Own code requirements.
const cryptoController = require("../own_modules/cryptoController.js");
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
			permission = acl.ac.can(role).execute("create").sync().on("rota-request");
			// Continue if yes, reject if no.
			if (permission.granted) {	
					res.render("pages/request.ejs", { info: "" });
			}
			else {
				res.render("pages/denied.ejs", { username: req.user.firstName });
			}
		}
	});
}

function post(req, res) {
	//Get role
	role = dbController.getUserRole(req.user.username, function (err, role) {
		if (err) {
			console.log(err)
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("create").sync().on("rota-request");
			// Continue if yes, reject if no.
			if (permission.granted) {	
                // Get the input from the request body.
                const input = req.body;
                // Storing task in database for specific user.	
				const dateTimeStart = input.startDate + " " + input.startTime;
				const dateTimeEnd = input.endDate + " " + input.endTime;
				dbController.storeRequest(req.user.id, input.type, Date.now(), dateTimeStart, dateTimeEnd, function (err, result) {
					if(err) {
						console.log(err);
						res.render('pages/request.ejs', { username: req.user.firstName, info: err });
					}
					else {
						console.log(result);
						res.render('pages/request.ejs', { info: result, username: req.user.firstName });
					}
				});
			}
			else {
				res.render("pages/denied.ejs", { username: req.user.firstName });
			}
		}
	});
}

module.exports.get = get;
module.exports.post = post;
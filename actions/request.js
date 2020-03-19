// Own code requirements.
const cryptoController = require("../own_modules/cryptoController.js");
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");
const moment = require("moment");

function get(req, res) {
	//Get role
	role = dbController.getUserRole(req.user.id, function callback(err, role) {
		if (err) {
			console.log(err);
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("create").sync().on("rota-request");
			// Continue if yes, reject if no.
			if (permission.granted) {	
				getRequestListAndRender(req, res, " ");
			}
			else {
				res.render("pages/denied.ejs", { username: req.user.firstName });
			}
		}
	});
}

function post(req, res) {
	//Get role
	role = dbController.getUserRole(req.user.id, function (err, role) {
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
				dbController.storeRequest(req.user.id, input.type, moment().format("YYYY-MM-DD - hh:mm"), input.startDate, input.endDate, input.startTime, input.endTime, function (err, result) {
					if(err) {
						getRequestListAndRender(req, res, err);
					}
					else {
						getRequestListAndRender(req, res, result);
					}
				});
			}
			else {
				res.render("pages/denied.ejs", { username: req.user.firstName });
			}
		}
	});
}

function getRequestListAndRender(req, res, message) {
	dbController.getUserRequests(req.user.id, function (err, result) {
		if(err) {
			console.log(err);
			res.render('pages/request.ejs', { username: req.user.firstName, requests: " ", info: err } );
		}
		else {
			res.render('pages/request.ejs', { username: req.user.firstName, requests : result, info: message });
		}
	});
}

module.exports.get = get;
module.exports.post = post;
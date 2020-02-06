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
			permission = acl.ac.can(role).execute('assign').sync().on('schedule');
			// Continue if yes, reject if no.
			if (permission.granted) {	
				if (role === "admin" || role === "root") {
					res.render("pages/assign.ejs", { info: "" });
				}
				else {
					res.render("pages/denied.ejs", { username: req.user.username });
				}
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
			permission = acl.ac.can(role).execute('assign').sync().on('schedule');
			// Continue if yes, reject if no.
			if (permission.granted) {	
				if (role === "admin" || role === "root") {
					// Get the input from the request body.
					const input = req.body;

					// Task definition from inputs.
					const task = {
						id: input.username+Date.now(),
						name: input.choice,
						start: input.start,
						end: input.end
					};

					console.log(task);
					
					// Getting data for user to append.
					(dbController.getUserData(input.username, function callback(err, data) {
						if (err) {
							console.log(err);
						}
						else {
							// Convert to appropriate format for storage.
							parsed = JSON.parse(data);
							// Check if empty, if so, insert task in array.
							if (data === JSON.stringify({})) {
								parsed = [task];
							}
							// If not, assume that it is array, push task to array.
							else {
								parsed.push(task);
							}
							const new_data = JSON.stringify(parsed);

							// Storing task in database for specific user.	
							(dbController.storeTask(input.username, new_data, function callback(err, result) {
								if (err) {
									throw err;
								}
								else {
									console.log(result);
									res.render("pages/assign.ejs", {info: "The user was assigned the task successfully."});
								}
							}));
						}
					}));
				}
				else {
					res.render("pages/denied.ejs", { username: req.user.username });
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
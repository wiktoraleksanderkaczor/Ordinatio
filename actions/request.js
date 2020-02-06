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
				res.render("pages/denied.ejs", { username: req.user.username });
			}
		}
	});
}

function post(req, res) {
	//Get role
	role = dbController.getUserRole(req.user.username, function callback(err, role) {
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
                
                // Request definition from inputs.
				const request = {
					id: req.user.username+Date.now(),
					name: input.choice,
					start: input.start,
					end: input.end
				};

				console.log(request);
                // Get current user requests.
                (dbController.getUserRequests(req.user.username, function callback(err, data) {
                    if (err) {
						console.log(err);
					}
					else {
						// Convert to appropriate format for storage.
						parsed = JSON.parse(data);
						// Check if empty, if so, insert task in array.
						if (data === JSON.stringify({})) {
							parsed = [request];
						}
						// If not, assume that it is array, push task to array.
						else {
							parsed.push(request);
						}
						const new_data = JSON.stringify(parsed);

						// Storing task in database for specific user.	
						(dbController.storeRequest(req.user.username, new_data, function callback(err, result) {
							if (err) {
								throw err;
							}
							else {
								console.log(result);
								res.render("pages/request.ejs", {info: "The user was assigned the task successfully."});
							}
						}));
					}
				}));
			}
			else {
				res.render("pages/denied.ejs", { username: req.user.username });
			}
		}
	});
}

module.exports.get = get;
module.exports.post = post;
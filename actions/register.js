//Module requirements
const moment = require("moment");

// Own code requirements.
const cryptoController = require("../own_modules/cryptoController.js");
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");


function get(req, res) {
	//Get role
	role = dbController.getUserRole(req.user.employeeId, function callback(err, role) {
		if (err) {
			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err);
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("register").sync().on("register");
			// Continue if yes, reject if no.
			if (permission.granted) {	
				return res.render("pages/register.ejs", { info: "" });
			}
			else {
				return res.render("pages/denied.ejs", { username: req.user.firstName });
			}
		}
	});
}

function post(req, res) {
	//Get role
	role = dbController.getUserRole(req.user.employeeId, function callback(err, role) {
		if (err) {
			console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  err)
		}
		else {
			// Check if role can do the action.
			permission = acl.ac.can(role).execute("register").sync().on("register");
			// Continue if yes, reject if no.
			if (permission.granted) {	
				if (role === "admin" || role === "root") {
					// Get the input from the request body.
					const input = req.body;
					
					if (input.user === "admin" && role === "admin") {
						return res.render("pages/register.ejs", { info: "Only the root account can create other administrators!" });
					}
					else {
						// Check that password verification matches.
						if (input.password != input.verify) {
							return res.render("pages/register.ejs", { info: "Passwords do not match, please try again!" });
						}
						else {
							// Check that there isn't another user already named the same.
							(dbController.getUserByEmail(input.email, function callback(err, result) {
								if (err) {
									throw err;
								}
								// If not, hash password and store user.
								else {
									var user = result;
									if (!user) {
										console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  "The email address isn't taken.");
										try {
											// Hash password.
											cryptoController.hashPassword(input.username, input.password, function callback(err, result) {
												if (err) {
													throw err;
												}
												else {
													console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  "Password hash: " + result);
													// Store user.
													dbController.storeUser(input.firstName, input.surname, input.jobTitle, input.email, result, input.role, function callback(err, result) {
														if (err) {
															throw err;
														}
														else {
															console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  result);
															return res.render("pages/register.ejs", {info: "Employee #" + result.newUserId + " - " + input.firstName + " " + input.surname + " (" + input.email + ") sucessfully registered"});
														}
													});
												}
											});
										}
										catch (e) {
											console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " +  e);
											return res.render("pages/register.ejs", {info: e});
										}
									}
									else {
										// Username is taken
										return res.render("pages/register.ejs", {info: "An employee account with that email address alread exists, please try again."});
									}
								}
							}));
						}
					}
				}
				else {
					return res.render("pages/denied.ejs", { username: req.user.firstName });
				}
			}
			else {
				return res.render("pages/denied.ejs", { username: req.user.firstName });
			}
		}
	});
}

module.exports.get = get;
module.exports.post = post;
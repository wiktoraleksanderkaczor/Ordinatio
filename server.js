// Module requirements.
const methodOverride = require("method-override");
const session = require("express-session");
const AccessControl = require('role-acl');
const bodyParser = require("body-parser");
const passport = require("passport");
const express = require("express");
const sqlite3 = require("sqlite3");
const uuidv4 = require("uuid/v4");
const https = require("https");
const fs = require("fs");

// Own code requirements.
const passportController = require("./passportController.js");
const cryptoController = require("./cryptoController.js");
const dbController = require("./dbController.js");

// Database file requirements.
const db = new sqlite3.Database("./users.db");


// Set up access control object.
const ac = new AccessControl();

/* 
	Users can create, delete and read rota and holiday requests.
	Admins can do what users can and reply to holiday request as well as counter-offer too.
	Root account can do what admins do and everything else.
*/

// Grant user permissions.
ac.grant('user')
	.execute('create').on('rota-request')
	.execute('delete').on('rota-request')
	.execute('read').on('rota-request')
	.execute('view').on('schedule');

// Create admin role which extends user role.
ac.grant('admin').extend('user');

// Grant admin permissions.
ac.grant('admin')
	.execute('reply').on('rota-request')
	.execute('counter-offer').on('rota-request')
	.execute('register').on('register')
	.execute('assign').on('schedule');

// Create the ultimate administrator account.
ac.grant('root').extend('admin');

// Grant root permissions.
ac.grant('root')
	.execute('delete').on('rota-request')
	.execute('delete').on('schedule');

// Set server settings and setup packages.
const app = express();
const port = process.env.PORT || 3000;

// Set viewer engine and file directory.
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/views/pages"));

// Set HTTP command parser.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 

// Express session setup.
app.use(session({
	genid: function(req) {
		return uuidv4() // use UUIDs for session IDs
	},
	secret: "a31ec33094189b0b", //generated from random.org
	resave: false,
	saveUninitialized: false
})); 

// Allow additional HTTP command like DELETE where client doesn't support it.
app.use(methodOverride("_method"));

// Passport session setup, has to be after express session setup.
app.use(passport.initialize());
app.use(passport.session());
passportController.initialize(passport);

// Create HTTPS server.
https.createServer({
	key: fs.readFileSync("server.key"),
	cert: fs.readFileSync("server.cert")
	}, app).listen(port, () => {
		console.log("Server up at https://localhost:3000/");
	});

// Redirect root to main if authenticated.
app.get("/", isAuthenticated, (req, res) =>
{
	res.redirect("/main");
});

// Redirect root to login if not authenticated.
app.get("/", isNotAuthenticated, (req, res) =>
{
	res.redirect("/login");
});

// Render login from login if not authenticated.
app.get("/login", isNotAuthenticated, (req, res) =>
{
	res.render("pages/login.ejs");
});

// Render register from register if authenticated.
app.get("/register", isAuthenticated, (req, res) =>
{
	//Get role
	role = dbController.getUserRole(req.user.username, function callback(err, role) {
		if (err) {
			console.log(err);
		}
		else {
			// Check if role can do the action.
			permission = ac.can(role).execute('register').sync().on('register');
			// Continue if yes, reject if no.
			if (permission.granted) {	
				if (role === "admin" || role === "root") {
					res.render("pages/register.ejs", { info: "" });
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
});

// Render main from main if authenticated.
app.get("/main", isAuthenticated, (req, res) =>
{
	//Get role
	role = dbController.getUserRole(req.user.username, function callback(err, role) {
		if (err) {
			console.log(err);
		}
		else {
			// Check if role can do the action.
			permission = ac.can(role).execute('view').sync().on('schedule');
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
});

// Handler for POST on login if not authenticated.
app.post("/login", isNotAuthenticated, passport.authenticate("local",
{
	successRedirect: "/main",
	failureRedirect: "/login",
	failureFlash: true
}));

// Handler for POST on register if authenticated.
app.post("/register", isAuthenticated, (req, res) =>
{
	//Get role
	role = dbController.getUserRole(req.user.username, function callback(err, role) {
		if (err) {
			console.log(err)
		}
		else {
			// Check if role can do the action.
			permission = ac.can(role).execute('register').sync().on('register');
			// Continue if yes, reject if no.
			if (permission.granted) {	
				if (role === "admin" || role === "root") {
					// Get the input from the request body.
					const input = req.body;
					
					if (input.user === "admin" && role === "admin") {
						res.render("pages/register.ejs", { info: "Only the root account can create other administrators!" });
					}
					else {
						// Check that password verification matches.
						if (input.password != input.verify) {
							res.render("pages/register.ejs", { info: "Passwords do not match, please try again!" });
						}
						else {
							console.log("\n -=- " + input.username + " -=- ");
							// Check that there isn't another user already named the same.
							(dbController.getUserByName(input.username, function callback(err, result) {
								if (err) {
									throw err;
								}
								// If not, hash password and store user.
								else {
									var user = result;
									if (!user) {
										console.log("The username isn't taken.");
										try {
											// Hash password.
											cryptoController.hashPassword(input.username, input.password, function callback(err, result) {
												if (err) {
													throw err;
												}
												else {
													console.log("Password hash: " + result);
													// Store user.
													dbController.storeUser(input.username, result, input.user, function callback(err, result) {
														if (err) {
															throw err;
														}
														else {
															console.log(result);
															res.render("pages/register.ejs", {info: "The user was created successfully."});
														}
													});
												}
											});
										}
										catch (e) {
											console.log(e);
											res.render("pages/register.ejs", {info: e});
										}
									}
									else {
										// Username is taken
										res.render("pages/register.ejs", {info: "The username is taken, try again."});
									}
								}
							}));
						}
					}
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
});

// Handler for DELETE to logout.
app.delete("/logout", isAuthenticated, (req, res) => 
{
	req.logOut();
	res.redirect("/login");
});

function isAuthenticated(req, res, next)
{
	if(req.isAuthenticated())
	{
		return next();
	}
	return res.redirect("/login");
}

function isNotAuthenticated(req, res, next)
{
	if(req.isAuthenticated())
	{
		return res.redirect("/main");
	}
	next();
}
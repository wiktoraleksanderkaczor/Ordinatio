// Module requirements.
const methodOverride = require("method-override");
const session = require("express-session");
const bodyParser = require("body-parser");
const flash = require("express-flash");
const passport = require("passport");
const express = require("express");
const sqlite3 = require("sqlite3");
const uuidv4 = require("uuid/v4");
const https = require("https")
const fs = require("fs")

// Own code requirements.
const passportController = require("./passportController.js");
const cryptoController = require("./cryptoController.js");
const dbController = require("./dbController.js");

// Database file requirements.
const db = new sqlite3.Database("./users.db");


// Set server settings and setup packages.
const app = express();
const port = process.env.PORT || 3000;

// Set viewer engine and file directory.
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/views/pages"));

// Set HTTP command parser.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 

// Set project directory.
app.use(flash());

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
		console.log("Server up at https://localhost:3000/")
	});

// Redirect root to inbox if authenticated.
app.get("/", isAuthenticated, (req, res) =>
{
	res.redirect("/inbox")
});

// Redirect root to login if not authenticated.
app.get("/", isNotAuthenticated, (req, res) =>
{
	res.redirect("/login")
});

// Render login from login if not authenticated.
app.get("/login", isNotAuthenticated, (req, res) =>
{
	res.render("pages/login.ejs")
});

// Render register from register if authenticated.
app.get("/register", isAuthenticated, (req, res) =>
{
	res.render("pages/register.ejs")
});

// Render inbox from inbox if authenticated.
app.get("/inbox", isAuthenticated, (req, res) =>
{
	res.render("pages/inbox.ejs")
});

// Handler for POST on login if not authenticated.
app.post("/login", isNotAuthenticated, passport.authenticate("local",
{
	successRedirect: "/inbox",
	failureRedirect: "/login",
	failureFlash: true
}));

// Handler for POST on register if authenticated.
app.post("/register", isAuthenticated, (req, res) =>
{
	// Get the input from the request body.
	const input = req.body
	
	// Check that password verification matches.
	if (input.password != input.verify) {
		res.render("pages/register.ejs", { alert: "Passwords do not match, please try again!" });
	}
	else {
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
								dbController.storeUser(input.username, result, function callback(err, result) {
									if (err) {
										throw err;
									}
									else {
										console.log(result)
									}
								});
							}
						});
						const data = { alert: "Welcome" + input.username + ", you can now log in." };
						res.render("pages/login.ejs", data);
					}
					catch (e) {
						const data = { alert: e.message };
						res.render("pages/register.ejs", data);
					}
				}
				else {
					const data = { alert: "Username is taken, choose another one." };
					res.render("pages/register.ejs", data);
				}
			}
		}));
	}
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
		return res.redirect("/inbox");
	}
	next();
}
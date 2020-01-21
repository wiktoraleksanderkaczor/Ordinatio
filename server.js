//import required packages
const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./users.db');
const fs = require('fs')
const https = require('https')
const uuidv4 = require('uuid/v4');

//import code from other files
const cryptoController = require('./cryptoController.js');
const dbController = require('./dbController.js');
const passportController = require('./passportController.js');

//set server settings and setup packages 
const app = express();
const port = process.env.PORT || 3000;

https.createServer({
	key: fs.readFileSync('server.key'),
	cert: fs.readFileSync('server.cert')
	}, app).listen(port, () => {console.log('Server up at https://localhost:3000/')});
app.set('view engine', 'ejs'); //sets up ejs as view handler
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.static(__dirname + '/views/pages'));
app.use(flash());
app.use(session(
	{
		genid: function(req) {
			return uuidv4() // use UUIDs for session IDs
		},
		secret: "a31ec33094189b0b", //generated from random.org
		resave: false,
		saveUninitialized: false
	})); 

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

passportController.initialize(passport);

// Get root page.
app.get('/', isAuthenticated, (req, res) =>
{
	res.redirect('/inbox')
});

// Render inbox from if authenticated.
app.get('/inbox', isAuthenticated, (req, res) =>
{
	res.render('pages/inbox.ejs')
});

// Render login form if not authenticated.
app.get('/login', isNotAuthenticated, (req, res) =>
{
	res.render('pages/login.ejs')
});

// Handler for POST on login.
app.post('/login', isNotAuthenticated, passport.authenticate('local',
{
	successRedirect: '/inbox',
	failureRedirect: '/login',
	failureFlash: true
}));


app.delete('/logout', isAuthenticated, (req, res) => 
{
	req.logOut();
	res.redirect('/login');
});

function isAuthenticated(req, res, next)
{
	if(req.isAuthenticated())
	{
		return next();
	}
	return res.redirect('/login');
}

function isNotAuthenticated(req, res, next)
{
	if(req.isAuthenticated())
	{
		return res.redirect('/inbox');
	}
	next();
}


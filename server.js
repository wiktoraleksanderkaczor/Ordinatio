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
	}, app).listen(port, () => {console.log('Server up')});
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

app.get('/', isAuthenticated, (req, res) =>
{
	res.redirect('/inbox')
});

app.get('/inbox', isAuthenticated, (req, res) =>
{
	res.render('pages/inbox.ejs')
});

app.get('/login', isNotAuthenticated, (req, res) =>
{
	res.render('pages/login.ejs')
});

app.post('/login', isNotAuthenticated, passport.authenticate('local',
{
	successRedirect: '/inbox',
	failureRedirect: '/login',
	failureFlash: true
}));

app.post('/register', isNotAuthenticated, (req, res) => 
{
	
	const input = req.body;
	if(input.password != input.password2)
	{
		res.render('pages/login.ejs', {alert: "Passwords dont match, please try again!"});
	}
	else
	{
		//if passwords match use this callback function to check if username already exists or not
		(dbController.getUserByName(input.username, function callback(err, result) 
		{ 
			if(err)
			{
				throw err;
			}
			else
			{
				var user = result;
				if(user == null)
				{
					console.log(68);
					try
					{
						//if username is available hash the provided PW and store it in the database
						cryptoController.hashPW(input.username, input.password);
						const data = { alert: "Welcome " + input.username + ", you may now log in using the form above."};
						res.render('pages/login.ejs', data);
					}
					catch(e)
					{
						//console.log(e.message);
						res.render('pages/login.ejs', {alert:e.message});
					}
				}
				else
				{
				res.render('pages/login.ejs', {alert:"Username already taken, choose a different username."});
				}
			}
			
		}));
	}
});

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


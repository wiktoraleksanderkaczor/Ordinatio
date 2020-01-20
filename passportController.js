const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./users.db');
const LocalStrategy = require('passport-local').Strategy
const passport = require('passport');

function initialize(passport)
{
	passport.use(new LocalStrategy(authenticateUser));
	passport.serializeUser(function(user, done) {
	return done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
	db.get('SELECT id, username FROM accounts WHERE id = ?', id, function(err, row) {
    if (!row) return done(null, false);
    return done(null, row);
	});
	});

}

function authenticateUser(username, password, done) 
{
	
	db.get('SELECT * FROM accounts WHERE username=$username',
	{
		$username:username
	},	
		function(err, row) 
	{  
		if(err)
		{
			throw err;
		}
		
		const user = row;
		
		if (row == null)
		{
			return done(null, false, {alert: 'No user found.'});
		}
		console.log(user);
		console.log(password);
		console.log(user.password);
		if(bcrypt.compareSync(password, user.password))
		{
			return done(null, user);
		}
		else
		{	
			return done(null, false, {alert: 'Incorrect password'});
		}
	
  
	});
}


module.exports.initialize = initialize;
module.exports.authenticateUser = authenticateUser;

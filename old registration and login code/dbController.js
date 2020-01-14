const sqlite3 = require ('sqlite3');
const db = new sqlite3.Database('./users.db');
const serverFunctions = require('./server.js');

	function storeUser(username, PWHash)
	{
		db.run
		(
			'INSERT INTO accounts (username, password) VALUES($username, $password)',
			{
				$username: username,
				$password: PWHash
			},
			(err) =>
			{
				if(err != null)
				{
					console.log(err.message);
					throw err;
				}
				
			}
		);
	}
	module.exports.storeUser = storeUser;
	
	function getUserByName(username, callback)
	{
			db.get
			(
				'SELECT * FROM accounts WHERE USERNAME=$name',
				{
					$name: username
				},
				(err, row) => 
				{
					if(err)
					{
						callback(err, null);
					}
					else
					{
						callback(null, row);
					}
				}
			);
	}
	module.exports.getUserByName = getUserByName;
	

	

const dbController = require('./dbController.js');
const bcrypt = require('bcrypt');


	async function hashPW(username, plainTextPW) 
	{
		var hash = await bcrypt.hash(plainTextPW, 10, function(err, hash)
		{
			if(err)
			{
				throw err;
			}
			else
			{
				dbController.storeUser(username, hash);
				return hash;
				console.log("here");
			}
		});
	}
	
	async function compareHashPW(username, plainTextPW)
	{	
		const user = dbController.getUserByName(username)
		if(user != null)
		{
				if (await bcrypt.compare(plainTextPW, user.password))
				{
					return true;
				}
				else
				{
					return false;
				}
		}
		else
		{
			return {alert: "User not found."};
		}
	}

	function storePWHash(err, hash, username)
	{
		
	}


module.exports.compareHashPW = compareHashPW;
module.exports.hashPW = hashPW;
module.exports.storePWHash = storePWHash;
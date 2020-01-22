
const bcrypt = require('bcrypt');


async function hashPW(username, plainTextPW, callback) 
{
	var hash = await bcrypt.hash(plainTextPW, 10, function(err, hash)
	{
		if(err)
		{
			throw err;
		}
		else
		{
			callback(null, hash);
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

module.exports.compareHashPW = compareHashPW;
module.exports.hashPW = hashPW;
module.exports.storePWHash = storePWHash;
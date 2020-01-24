// Module requirements.
const bcrypt = require("bcrypt");


// Use BCrypt module to hash password with salt in hash.
async function hashPassword(username, plainPassword, callback) {
	var hash = await bcrypt.hash(plainPassword, 10, function(err, hash) {
		if (err) {
			callback(err);
		}
		else {
			callback(null, hash);
		}
	});
}

module.exports.hashPassword = hashPassword;
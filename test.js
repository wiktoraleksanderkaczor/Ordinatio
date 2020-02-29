cryptoController = require('./own_modules/cryptoController.js');
dbController = require('./own_modules/dbController.js');

/*cryptoController.hashPassword("david.rob87@googlemail.com", "Chichi12", function (err, result) {
	if(err) {
		console.log(err);
	}
	else {
		dbController.storeUser("David", "Robertson", "Admin", "david.rob87@googlemail.com", result, "Root", function (err, result) {
			if(err) {
				console.log(err);
			}
			else {
				console.log(result);
			}
		});
	}
});
*/
dbController.getUserByEmail("david.rob87@googlemail.com", function (err, row) {
	if(err) {
		console.log(err);
	}
	else {
		console.log(row);
	}
});

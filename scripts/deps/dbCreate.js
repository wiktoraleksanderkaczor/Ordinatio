// Module requirements.
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const validator = require('password-validator');

// Own code requirements
const cryptoController = require(path.join(__dirname, "..", "..", "own_modules", "cryptoController.js"));


// Database file path constant.
const dbPath = path.join(__dirname, "..", "database", "users.db");

// Set up password schema for "password-validator" module.
var schema = new validator();

// The schema.
schema.is().min(8)
	.is().max(24)
	.has().uppercase()
	.has().lowercase()
	.has().digits();

// Set up "readline" to get the user input. 
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const initialiseDb = async function () {
	try {
		// Check if the database file already exists.
		if (fs.existsSync(dbPath)) {
			console.log("\nThe database already exists, select option 2 to clear it.\n");
			process.exit(0);
		}
		else {
			// Prompt the user for new username and password 
			rl.question("\nEnter the new username for the Adminstrator account:\n", function (username) {
				rl.question("\nEnter the new password for the Administrator account. (Must be between 8-24 characters long and contain at least one upper case letter, lower case letter and number.)\n", function (password) {
					if (!schema.validate(password)) {
						console.log("\nInvalid password, must be between 8-24 characters long and contain at least one upper case letter, lower case letter and number.");
						initialiseDb();
					}
					else {
						rl.question("\nConfirm new password:\n", function (verify) {
							if (password != verify) {
								console.log("\nThe passwords don't match!\n")
								initialiseDb();
							}
							else {
								// Import the "dbController" if the passwords matched.
								const dbController = require(path.join(__dirname, "..", "..", "own_modules", "dbController.js"));
								dbController.initialise();
								console.log("\n The database file was created.\n");
								try {
									// Hash the new Administrator password. 
									cryptoController.hashPassword(username, password, function callback(err, result) {
										if (err) {
											console.log(err);
											process.exit(1);
										}
										else {
											// Store the Administator account details in "accounts" table 
											dbController.storeUser(username, result, "root", function callback(err, result) {
												if (err) {
													console.log(err);
													process.exit(1);
												}
												else {
													console.log(result + "\n");
													console.log("Ordinatio is now initialised.\n");
													process.exit(0);
												}
											});
										}
									});
								}
								catch (e) {
									console.log(e);
								}
							}
						});
					}
				});
			});
		}
	}
	catch (e) {
		console.log(e);
	}
}

initialiseDb();

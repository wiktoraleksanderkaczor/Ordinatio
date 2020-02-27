// Module requirements.
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const yesno = require('yesno');
const cp = require('child_process');

// Own code requirements.
const dbCreatePath = path.join(__dirname, "..", "scripts", "deps", "dbCreate.js");


// Database file path constant.
const dbPath = path.join(__dirname, "..", "database", "users.db");

// Function to display the menu and handle user choice.
const menu = async function () {
	// Set up "readline" to get user input. 
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.question("Welcome to the Ordinatio setup\n\n1. Initialise the user database.\n2. Clear the user database.\n3. Change the administrator username or password.\n4. Exit.\n\n", function (input) {
		// Display the menu and get user choice.
		switch (input) {
			// Menu handler case statement.
			case "1":
				// Close the "readline" interface to not interfere with input stream from new process.
				rl.close();
				// Ceate a child process for the "dbCreate.js" file, this code must be run in a seperate process because of how sqlite3 handles closing the database file.
				// This would cause an error if user did option 2 after option 1.
				const dbCreate = cp.spawn('node', [dbCreatePath], { stdio: [process.stdin, process.stdout, process.stderr] });
				// Display data from child process' stdout in this process. 
				dbCreate.on('data', stdout => {
					console.log(stdout.toString());
				});
				// Return to the menu after the child process ends.
				dbCreate.on('close', code => {
					menu();
				});
				break;
			case "2":
				// Close the "readline" interface to not interfere with input stream from new process.
				rl.close();
				deleteDb();
				break;
			// Option 3, WIP (Work In Progress).
			case "3":
				menu();
				break;
			case "4":
				process.exit(0);
				break;
			// Invalid input case.
			default:
				console.log("\nInvalid input, please choose from the menu above.\n");
				menu();
				break;
		}
	});
}

// Function to delete the user database file. 
const deleteDb = async function () {
	try {
		// Check if the database file already exists.
		if (fs.existsSync(dbPath)) {
			// User confirmation of intention.
			const ok = await yesno({
				question: "\nThis will remove your user database, are you sure you want to continue? [y/n]\n"
			});
			if (ok) {
				// Delete user database.
				await fs.unlink((dbPath), function (err) {
					if (err) {
						console.log(err);
						menu();
					}
					else {
						// The database was deleted successfully.
						console.log("\nThe user database was deleted.\n");
						menu();
					}
				});
			}
			// Return to the menu if the user says no.
			else {
				menu();
			}
		}
		// If the database file doesn't exist.
		else {
			console.log("\nUser database not found, select option 1 to create new database.\n");
			menu();
		}
	}

	catch (e) {
		console.log(e);
	}
}

menu();

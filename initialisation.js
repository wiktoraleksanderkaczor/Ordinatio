// Module requirements.
const firstRun = require("first-run");
const readline = require("readline");
const sqlite3 = require("sqlite3");

// Own code requirements.
const cryptoController = require("./cryptoController.js");
const dbController = require("./dbController.js");

// Database file requirements.
const db = new sqlite3.Database("./users.db")


// Variables to hold database creation statements for easier editing.
const database_statement1 = "CREATE TABLE accounts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, username TEXT, password TEXT, role TEXT)"
const database_statement2 = "CREATE TABLE roles (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, role_name TEXT, permissions JSON1)"

// Creating command line interface for "readline" module.
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const start = async function() {
    // If application running for the first time.
    if (firstRun()) {
        //Initialise database.
        db.serialize(() => {
            db.run(database_statement1);
            db.run(database_statement2);
        });
        db.close();
        console.log("Database initialised.");

        // Prompt for new administator username and password.
        rl.question("New administrator username: ", function(username) {
            rl.question("Administrator account password: ", function(password) {
                rl.question("Verify password: ", function(verify) {
                    // If given passwords don't match.
                    if (password != verify) {
                        console.log("The given passwords didn't match. Try again.");
                        firstRun.clear();
                    }
                    // Else, check if user already exists in database.
                    else {
                        (dbController.getUserByName(username, function callback(err, result) {
                            // If yes.
                            if (err) {
                                throw err;
                            }
                            // If they don't exist, hash the password and store user in database.
                            else {
                                var user = result;
                                if (user == null) {
                                    console.log("The username is not taken.");
                                    try {
                                        cryptoController.hashPassword(username, password, function callback(err, result) {
                                            if (err) {
                                                throw err;
                                            }
                                            else {
                                                dbController.storeUser(username, result, function callback(err, result) {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                    else {
                                                        console.log(result)
                                                    }
                                                });
                                                console.log("The administration account was created successfully.")
                                            }
                                        });
                                    }
                                    catch (e) {
                                        console.log(e);
                                    }
                                }
                                else {
                                    console.log("The username is taken, clear your \"users.db\".");
                                }
                            }
                        }));
                    }

                    console.log("Initialisation of Ordinatio is complete.");
                    console.log("You can use Ctrl+C once the message says initialisation is complete.")
                });
            });
        });
    }
    else {
        console.log("This isn't the first time this app was ran, please clear the configuration with \"node clearInitialisation.js\".");
        process.exit(0)
    }

    // Define closing function.
    rl.on("close", function() {
        console.log("\nClosing down.");
        process.exit(0);
    });
}

//Entry point.
start();
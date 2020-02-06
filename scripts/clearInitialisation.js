// Module requirements.
const firstRun = require("first-run");
const yesno = require("yesno"); 
const path = require("path");  
const fs = require("fs");


const start = async function() {
    // User confirmation that this is what they want.
    const ok = await yesno({
        question: "This will remove your user database, are you sure you want to continue? [y/n]"
    });
    if (ok) {
        // Clear first run variable.
        firstRun.clear();
        console.log("Cleared first run variable.")

        // Delete user database.
        await fs.unlink(path.join(__dirname, "..", "database", "users.db"), function (err) {
            if (err) {
                console.log("The users database doesn't exist.")
            }
            else {
                // The file was deleted successfully.
                console.log("Users database was deleted!");
            }
        }); 
    }
}

// Entry point.
start();
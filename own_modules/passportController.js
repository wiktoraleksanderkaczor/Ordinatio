// Module requirements.
const LocalStrategy = require("passport-local").Strategy
const passport = require("passport");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const moment = require("moment");

// Database file requirements.
const db = new sqlite3.Database(path.join(__dirname, "..", "database", "users.db"));


// Initialise passport with local authentication strategy.
function initialize(passport) {
    passport.use(new LocalStrategy(authenticateUser));
    passport.serializeUser(function(user, done) {
        return done(null, user.employeeId);
    });

    passport.deserializeUser(function(employeeId, done) {
        db.get("SELECT * FROM accounts WHERE employeeId = ?", employeeId, function(err, row) {
            if (!row) {
                return done(null, false);
            } else {
                return done(null, row);
            }
        });
    });

}

// Define local authentication function.
function authenticateUser(username, password, done) {
    db.get("SELECT * FROM accounts WHERE username=$username", { $username: username }, function(err, row) {
        if (err) {
            throw err;
        }

        const user = row;

        if (row == null) {
            return done(null, false, { alert: "No user found." });
        }

        if (bcrypt.compareSync(password, user.password)) {
            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: Successful login by user #" + user.employeeId + " - " + user.firstName + " " + user.surname + "(" + user.username + ")");
            return done(null, user);
        } else {
            return done(null, false, { alert: "Incorrect password" });
        }
    });
}

module.exports.initialize = initialize;
module.exports.authenticateUser = authenticateUser;
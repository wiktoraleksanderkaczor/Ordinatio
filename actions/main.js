//Module requirements
const moment = require("moment");

// Own code requirements.
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");


function get(req, res) {
    //Get role
    role = dbController.getUserRole(req.user.employeeId, function callback(err, role) {
        if (err) {
            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
        } else {
            // Check if role can do the action.
            permission = acl.ac.can(role).execute("view").sync().on("schedule");
            // Continue if yes, reject if no.
            if (permission.granted) {
                if (role === "root" || role === "admin") {
                    dbController.getAllTasks(function(err, taskResults) {
                        if (err) {
                            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
                            return res.render('pages/main-admin.ejs', { info: err, username: req.user.firstName, tasks: "", requests: "", messages: "" });
                        } else {
                            dbController.getAllRequests(function(err, requestResults) {
                                if (err) {
                                    console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
                                    return res.render('pages/main-admin.ejs', { info: err, username: req.user.firstName, tasks: "", requests: "", messages: "" });
                                } else {
                                    dbController.getUserMessages(req.user.employeeId, function(err, messageResults) {
                                        if (err) {
                                            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
                                            return res.render('pages/main-admin.ejs', { info: err, username: req.user.firstName, tasks: taskResults, requests: requestResults, messages: "" });
                                        } else {
                                            return res.render('pages/main-admin.ejs', { info: "", username: req.user.firstName, tasks: taskResults, requests: requestResults, messages: messageResults });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    dbController.getUserMessages(req.user.employeeId, function(err, messageResults) {
                        if (err) {
                            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
                            return res.render('pages/main.ejs', { info: err, username: req.user.firstName, messages: "" });
                        } else {
                            return res.render('pages/main.ejs', { info: err, username: req.user.firstName, messages: messageResults });
                        }
                    });
                }
            };
        }
    });
}
module.exports.get = get;
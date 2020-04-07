// Module requirements
const moment = require("moment");
const path = require("path");

// Own code requirements.
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");

function time_now() { return "\n[" + moment().format("YYYY-MM-DD - HH:mm:ss") + "]: "; };

function gantt(req, res) {
    //Get role
    (dbController.getUserRole(req.user.employeeId, function callback(err, role) {
        if (err) {
            console.log(time_now() + err);
        } else {
            // Check if role can do the action.
            permission = acl.ac.can(role).execute("view").sync().on("schedule");
            // Continue if yes, reject if no.
            if (permission.granted) {
                // Getting data for user to append.
                (dbController.getUserTasks(req.user.employeeId, function callback(err, data) {
                    if (err) {
                        console.log(time_now() + err);
                    } else {
                        // Convert to appropriate format for usage.
                        to = [];
                        for (const task in data) {
                            to.push({
                                id: data[task].taskId,
                                name: data[task].type,
                                start: data[task].dateStart,
                                end: data[task].dateEnd,
                                progress: 100,
                                timeStart: data[task].timeStart,
                                timeEnd: data[task].timeEnd
                            })
                        };

                        // Check if empty, if so, log error.
                        if (data === JSON.stringify({})) {
                            console.log(time_now() + "Error; " + req.user.username + " JSON empty.");
                        }
                        // If not, send to client requsting it.
                        else {
                            res.json(to);
                        }
                    }
                }));
            } else {
                res.json({ "error": "Denied access" });
            }
        }
    }));
}

function requests(req, res) {
    //Get role
    (dbController.getUserRole(req.user.employeeId, function callback(err, role) {
        if (err) {
            console.log(time_now() + err);
        } else {
            // Check if role can do the action.
            permission = acl.ac.can(role).execute("view").sync().on("schedule");
            // Continue if yes, reject if no.
            if (permission.granted) {
                // Getting data for user to append.
                (dbController.getUserRequests(req.user.username, function callback(err, data) {
                    if (err) {
                        console.log(time_now() + err);
                    } else {
                        // Convert to appropriate format for usage.
                        parsed = JSON.parse(data);
                        // Check if empty, if so, log error.
                        if (data === JSON.stringify({})) {
                            console.log(time_now() + "Error; " + req.user.username + " JSON empty.");
                        }
                        // If not, send to client requsting it.
                        else {
                            res.json(parsed);
                        }
                    }
                }));
            } else {
                res.json({ "error": "Denied access" });
            }
        }
    }));
}

module.exports.gantt = gantt;
module.exports.requests = requests;
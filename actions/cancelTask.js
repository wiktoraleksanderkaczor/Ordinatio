// Module requirements
const path = require("path");
const moment = require('moment');

function time_now() { return "\n [" + moment().format("YYYY-MM-DD - HH:mm:ss") + "]: "; };

function message_time() { return moment().format("YYYY-MM-DD - HH:mm"); };

// Own code requirements
const dbController = require("../own_modules/dbController.js");

function post(req, res) {
    //check if user has the appropriate role to accept a task
    console.log(time_now() + req.query);
    dbController.getUserRole(req.user.employeeId, function(err, role) {
        if (err) {
            console.log(time_now() + err);
        } else {
            //retrieve the task from the dbController
            dbController.getTask(req.query.taskId, function(err, task) {
                if (err) {
                    console.log(time_now() + err);
					res.redirect('/main');
                } else {
              
                    //if the user is root or admin, OR if the task was made by the logged in user, allow them to cancel/reject it 
                    if (role === "root" || role === "admin") {

                        //Store a message for the admin stating that they rejected the employees task 
                        var message_text = "You cancelled " + task.type + " #" + task.taskId + " for employee #" + task.employeeId +
                            " - " + task.firstName + " " + task.surname + " (" + task.username + ").";
                        dbController.storeMessage(req.user.employeeId, req.user.employeeId, message_time(), message_text, function(err, result) {
                            if (err) {
                                console.log(time_now() + err);
								res.redirect('/main');
                            } else {
                                console.log(time_now() + result);

                                //then store a message for the employee stating that their task was cancelled
                                var message_text = "Your " + task.type + ", " + task.type + " id #" + task.taskId + "(" + task.dateStart + " " + task.timeStart + " - " + task.dateEnd + " " + task.timeEnd + ") was cancelled.";
                                dbController.storeMessage(req.user.employeeId, task.employeeId, message_time(), message_text, function(err, result) {
                                    if (err) {
                                        console.log(time_now() + err);
										res.redirect('/main');
                                    } else {
                                        console.log(time_now() + result);

                                        //delete the task from the tasks table
                                        dbController.deleteTask(task.taskId, function(err, result) {
                                            if (err) {
                                                console.log(time_now() + err);
												res.redirect('/main');
                                            } else {
                                                console.log(time_now() + result);
												res.redirect('/main');
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        return res.render('pages/denied.ejs', { username: req.user.firstNam });
                    }
                }
            });
            //Otheriwse, redirect to denied page.
        }
    });
}

function get(req, res) {
    res.redirect('/main');
}

module.exports.post = post;
module.exports.get = get;
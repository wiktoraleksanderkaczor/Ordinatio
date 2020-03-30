// Module requirements
const path = require("path");
const moment = require('moment');

function time_now() { return "\n" + moment().format("YYYY-MM-DD - HH:mm:ss") + ": "; };

function message_time() { return moment().format("YYYY-MM-DD - HH:mm"); };

// Own code requirements
const dbController = require("../own_modules/dbController.js");

function post(req, res) {
    //check if user has the appropriate role to accept a request
    console.log(time_now() + req.query);
    dbController.getUserRole(req.user.employeeId, function(err, role) {
        if (err) {
            console.log(time_now() + err);
        } else {
            //retrieve the request from the dbController
            dbController.getRequest(req.query.requestId, function(err, request) {
                if (err) {
                    console.log(time_now() + err);
                } else {
                    console.log(time_now() + request);
                    //if the user is root or admin, OR if the request was made by the logged in user, allow them to cancel/reject it 
                    if (role === "root" || role === "admin" || req.user.employeeId === request.employeeId) {

                        //Store a message for the admin stating that they rejected the employees request 
                        var message_text = "You rejected " + request.type + " request #" + request.requestId + " for employee #" + request.employeeId +
                            " - " + request.firstName + " " + request.surname + " (" + request.username + ").";
                        dbController.storeMessage(req.user.employeeId, req.user.employeeId, message_time(), message_text, function(err, result) {
                            if (err) {
                                console.log(time_now() + err);
                            } else {
                                console.log(time_now() + result);

                                //then store a message for the employee stating that their request was cancelled
                                var message_text = "Your " + request.type + " request (request #" + request.requestId + ") was cancelled or rejected.";
                                dbController.storeMessage(req.user.employeeId, request.employeeId, message_time(), message_text, function(err, result) {
                                    if (err) {
                                        console.log(time_now() + err);
                                    } else {
                                        console.log(time_now() + result);

                                        //delete the request from the requests table
                                        dbController.deleteRequest(request.requestId, function(err, result) {
                                            if (err) {
                                                console.log(time_now() + err);
                                            } else {
                                                console.log(time_now() + result);

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
    res.redirect('/main');
}

function get(req, res) {
    res.redirect('/main');
}

module.exports.post = post;
module.exports.get = get;
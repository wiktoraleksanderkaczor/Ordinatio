// Module requirements
const path = require("path");
const moment = require('moment');

function time_now() { return "\n [" + moment().format("YYYY-MM-DD - HH:mm:ss") + "]: "; };

function message_time() { return moment().format("YYYY-MM-DD - HH:mm"); };

// Own code requirements
const dbController = require("../own_modules/dbController.js");

function post(req, res) {
    //check if user has the appropriate role to accept a task
    dbController.getUserRole(req.user.employeeId, function(err, role) {
        if (err) {
            console.log(time_now() + err);
        } 
		else {
			if(role === "root" || role === "admin") {
				var taskIds = JSON.parse(req.query.taskIds);
				console.log(taskIds[0]);
				console.log(JSON.parse[taskIds]);
				
				//Inner function to recursively delete tasks.
				function deleteTasks(taskIdsIndex) {
					if(taskIds[taskIdsIndex]) {
						dbController.getTask(taskIds[taskIdsIndex], function (err, task) {
							if(err) {
								console.log(time_now() + err)
								res.redirect('/main');
							}
							else {
								dbController.storeMessage(req.user.employeeId, task.employeeId, message_time(), "Your " + task.type + "(" + task.type + " id #" + task.taskId + ") was cancelled by " + req.user.jobTitle + " " + req.user.firstName + " " + req.user.surname + "(" + req.user.username + ".", function (err, result) {
									if(err) {
										console.log(time_now() + "Error storing employee message for cancelled task: \n" + err);
									}
									else {
										dbController.storeMessage(req.user.employeeId, req.user.employeeId, message_time(), "You cancelled " + task.type + " #" + task.taskId + " for employee #" + task.employeeId + ".", function (err, result) {
											if(err) {
												console.log(time_now() + "Error storing admin message for cancelled task: \n" + err);
											}
											else {
												dbController.deleteTask(task.taskId, function (err, result) {
													if(err) {
														console.log(time_now() + "Error deleting task: \n" + err);
														res.redirect('/main');
													}
													else {
														console.log(result);
														checkIfFinished(taskIdsIndex);
													}
												});
											}
										});
									}
								});
							}
						});
					} 
					else {
						checkIfFinished(taskIdsIndex);
					}
				}
				
				//Inner function to check if all tasks have been deleted.
				function checkIfFinished(taskIdsIndex) {
					if(taskIdsIndex < taskIds.length) {
						deleteTasks(taskIdsIndex + 1)
					}
					else {
						res.redirect('/main');
					}
				}
				deleteTasks(0);
			}
			else {
				res.redirect('/main');
			}
		}
	});
}

function get(req, res) {
    res.redirect('/main');
}

module.exports.post = post;
module.exports.get = get;
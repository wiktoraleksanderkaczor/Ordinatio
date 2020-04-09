//Module requirements
const moment = require("moment");

// Own code requirements.
const dbController = require("../own_modules/dbController.js");
const acl = require("../own_modules/accessControl.js");



function time_now() { return "\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: "; };

function get(req, res) {
    //Get role
    role = dbController.getUserRole(req.user.employeeId, function callback(err, role) {
        if (err) {
            console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
        } 
		else {
			// Check if role can do the action.
            permission = acl.ac.can(role).execute("view").sync().on("schedule");
            // Continue if yes, reject if no.
            if (permission.granted) {
				
				//Set up response object with default values.
				var responseObject = { 
					info: "",
					username: req.user.firstName,
					shifts: "",
					requests: "",
					messages: "",
				}
				
				//Check if user is root or admin so admin main page can be rendered.
				if (role === "root" || role === "admin") {
					
					//Get all outstanding requests on the system
					dbController.getAllRequests(function(err, requestResults) {
						
						//If error, render page with error message as info
						if (err) {
							console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
							responseObject.info = err;
							return res.render('pages/main-admin.ejs', responseObject);
						} 
						else {
							responseObject.requests = requestResults;
							//Get all the user's messages to display 
							dbController.getUserMessages(req.user.employeeId, function(err, messageResults) {
								if (err) {
									console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
										responseObject.info = err;
										return res.render('pages/main-admin.ejs', responseObject);
									} 
									else {
										responseObject.messages = messageResults;
										//Call organise shifts to prepare shifts for display for admin page
										organiseShifts(res, responseObject, req.user, requestResults, messageResults);
									}
								});
						}
					});
				}
				else {
						dbController.getUserMessages(req.user.employeeId, function(err, messageResults) {
							if (err) {
								console.log("\n[" + moment().format("YYYY-MM-DD - HH:mm:ss:SSS") + "]: " + err);
								responseObject.info = err;
								return res.render('pages/main.ejs', responseObject);
							} 
							else {
								responseObject.messages = messageResults;
								return res.render('pages/main.ejs', responseObject);
							}
						});
				}
            }
			else {
				return res.render('pages/denied.ejs', responseObject);
			}
		}
	});
}

//Function to organise shifts so they can be displayed for admins, showing shifts with the same start/end times as single shifts with a list of employees for that shift.
function organiseShifts(res, responseObject, user, requestResults, messageResults) {
	
	//Array to hold the final list of organised shifts.
	var organisedShifts = [];
	
	//Array to hold a temporary employee list for current shift being organised.
	var employeeList = [];
	
	//Object for the shift currently being organised.
	var currentShift = {
			shiftId: "",
			dateStart: "",
			dateEnd: "",
			timeStart: "",
			timeEnd: "",
			employees: []
	};

	//Start by getting the list of all shifts on the system.
	dbController.getAllShifts(function (err, allShifts) {
		if(err) {
			console.log(time_now() + err);
			responseObject.info = err;
			return res.render('pages/main-admin.ejs', responseObject);
		}
		else {
			console.log(time_now() + "Organising shifts for admin display.");
			console.log(time_now() + allShifts.length + "shifts found.");
			
			//Inner function to be called recursively for each shift in the database, sets up a new shift object with an empty list of employees.
			function prepareShift(allShiftsIndex) {
				if(allShifts[allShiftsIndex]) {
					
					currentShift.shiftId = allShifts[allShiftsIndex].taskId;
					currentShift.dateStart = allShifts[allShiftsIndex].dateStart;
					currentShift.dateEnd = allShifts[allShiftsIndex].dateEnd;
					currentShift.timeStart = allShifts[allShiftsIndex].timeStart;
					currentShift.timeEnd = allShifts[allShiftsIndex].timeEnd;
					currentShift.employees = [];
					currentShift.employees.push({ firstName: allShifts[allShiftsIndex].firstName, surname: allShifts[allShiftsIndex].surname, username: allShifts[allShiftsIndex].username, jobTitle: allShifts[allShiftsIndex].jobTitle, employeeShiftId: allShifts[allShiftsIndex].taskId });
					
					//Call addEmployees to add employees to the new shift's employee list.
					addEmployees(0);
					
				//If the next shift is undefined, call the function checkIfFinished
				} else {
					checkIfFinished(allShiftsIndex);
				}
			
				//Inner function to find shifts with the same start/end times as the current shift and add the employees from those shifts to the current shift's employee list.
				function addEmployees(matchingShiftsIndex) {
					
					//Get list of all shifts with the same start and end times 
					dbController.getMatchingShifts(allShifts[allShiftsIndex].taskId, allShifts[allShiftsIndex].dateStart, allShifts[allShiftsIndex].dateEnd, allShifts[allShiftsIndex].timeStart, allShifts[allShiftsIndex].timeEnd, function (err, matchingShifts) {
						if(err) {
							console.log(time_now() + "Error getting matching shifts for shift #" + allShifts[allShiftsIndex] + ": " + "\n" + err);
							responseObject.info = err;
							return res.render('pages/main-admin.ejs', responseObject);
						}
						else {
							
							//If there is another matching shift at the next index...
							if(matchingShifts[matchingShiftsIndex]) {
								
								//Add an object with the employee from the matching shift's details to the employees list of the currentShift object.
								currentShift.employees.push({ firstName: matchingShifts[matchingShiftsIndex].firstName, surname: matchingShifts[matchingShiftsIndex].surname, username: matchingShifts[matchingShiftsIndex].username, jobTitle: matchingShifts[matchingShiftsIndex].jobTitle, employeeShiftId: matchingShifts[matchingShiftsIndex].taskId });
								
								//Remove the matching shift from the list of all shifts so it is not processed multiple times.
								allShifts.splice(allShifts.indexOf(matchingShifts[matchingShiftsIndex], 1));
							}
							
							//If the index used for the last call of addEmployees is still less than the length of the matching shifts list, increment the index and call the function again
							if(matchingShiftsIndex < matchingShifts.length) {
								addEmployees(matchingShiftsIndex+1);
							}
							
							//Otherwise, add the currentShift object to the list of organised shifts and then call checkIfFinished.
							else {
								organisedShifts.push(currentShift);
								checkIfFinished(allShiftsIndex);
							}
						}
					});
				}
				
				//Another inner function to check if there are still shifts to be organised or if the main page is ready to be rendered.
				function checkIfFinished(allShiftsIndex) {
					
					//Call prepareShifts again if the previously used index is still lower than the number of shifts on the system.
					if(allShiftsIndex < allShifts.length) {
						prepareShift(allShiftsIndex+1);
					}
					
					//Otherwise, all shifts have been organised so the main page can be rendered.
					else {
						responseObject.shifts = organisedShifts;
						return res.render('pages/main-admin.ejs', responseObject);
					}
				}
			}
			
			//If shifts were found, call prepareShift to begin organising them.
			if(allShifts.length > 0) {
				prepareShift(0);
			}
			
			//Otherwise, render the page with no shifts found message.
			else {
				console.log(time_now() + "No upcoming shifts found.");
				responseObject.info = "No upcoming shifts found.";
				return res.render('pages/main-admin.ejs', responseObject);
			}
		}		
	});
}



module.exports.get = get;
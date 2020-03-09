const dbController = require("../own_modules/dbController.js");

function post(req, res) {
	//check if user has the appropriate role to accept a request
	console.log(req.query);
	dbController.getUserRole(req.user.id, function (err, role) {
		if(err) {
			console.log(err);
		}
		else {
			//retrieve the request from the dbController
			dbController.getRequest(req.query.requestId, function (err, request) {
				if(err) {
					console.log(err);
				}
				else {
					console.log(request);
					//if the user is root or admin, OR if the request was made by the logged in user, allow them to cancel/reject it 
					if(role === "root" || role === "admin" || req.user.id === request.employeeId) {
						dbController.deleteRequest(request.requestId, function (err, result) {
							if(err) {
								console.log(err);
							}
							else {
								console.log(result);
								
							}
						});
					}
					else {
						res.render('pages/denied.ejs', { username: req.user.firstNam });
					}
				}
			});
			//Otheriwse, redirect to denied page.
		} 
	});
	res.redirect('/main');
}


function get(req, res) {
	
}
module.exports.post = post;
module.exports.get = get;
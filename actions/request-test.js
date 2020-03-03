const dbController = require('../own_modules/dbController.js')



function get (req, res) {
	dbController.getUserRequests("1", function (err, result) {
		if(err) {
			console.log(err);
		}
		else {
			res.render('pages/test.ejs', { requests : result });
		}
	});
}

module.exports.get = get;
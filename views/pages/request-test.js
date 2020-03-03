const dbController = require('../own_modules/dbController.js')
dbController.getUserRequests(1, function (err, result) {
	if(err) {
		console.log(err);
	}
	else {
		var listDiv = document.getElementById('requests');
                    var ul = document.createElement('ul');
                    for (var i = 0; i < result.length; ++i) {
                        var li=document.createElement('li');
                        // Use innerHTML to set the text.
                        li.innerHTML = result[i].type;   
                        ul.appendChild(li);                                 
                    }
					listDiv.appendChild(ul);
	}
});

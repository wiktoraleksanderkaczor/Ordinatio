//Module requirements.
const AccessControl = require('role-acl');


// Set up access control object.
const ac = new AccessControl();

/* 
	Users can create, delete and read rota and holiday requests.
	Admins can do what users can and reply to holiday request as well as counter-offer too.
	Root account can do what admins do and everything else.
*/

// Grant user permissions.
ac.grant('user')
	.execute('create').on('rota-request')
	.execute('delete').on('rota-request')
	.execute('read').on('rota-request')
	.execute('view').on('schedule');

// Create admin role which extends user role.
ac.grant('admin').extend('user');

// Grant admin permissions.
ac.grant('admin')
	.execute('reply').on('rota-request')
	.execute('counter-offer').on('rota-request')
	.execute('register').on('register')
	.execute('assign').on('schedule');

// Create the ultimate administrator account.
ac.grant('root').extend('admin');

// Grant root permissions.
ac.grant('root')
	.execute('delete').on('rota-request')
	.execute('delete').on('schedule');

module.exports.ac = ac;
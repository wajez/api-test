const test = require('../../src/')
	, app  = require('./app.user')
	, transform = require('wajez-transform')
	, User = require('./user')

const json = transform({
	id: 'id',
	name: 'name',
	email: 'email',
	token: 'token'
})

test(app).resource(User, {
	prefix: '/api',
	create: ['name', 'email', 'password'],
	json: { // required
		resource: json, 
		collectionItem: json
	}
})

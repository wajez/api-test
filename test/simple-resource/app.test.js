const test = require('../../src/')
	, app  = require('./app')
	, transform = require('wajez-transform')

const json = transform({
	id: 'id',
	name: 'name',
	email: 'email',
	token: 'token'
})

test(app).resource('User', {
	create: ['name', 'email', 'password'],
	json: { // required
		resource: json, 
		collectionItem: json
	}
})

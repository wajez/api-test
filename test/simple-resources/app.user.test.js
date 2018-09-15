const test = require('../../src/')
	, app  = require('./app.user')
	, transform = require('wajez-transform')
	, mongoose = require('mongoose')
	, User = require('./user')

const json = transform({
	id: 'id',
	name: 'name',
	email: 'email',
	token: 'token'
})
describe('Simple resource > User', () => {
	before(() => mongoose.connect(`mongodb://localhost/chwia-api-test`))

	test(app).resource(User, {
		prefix: '/api',
		create: ['name', 'email', 'password'],
		json: { // required
			resource: json, 
			collectionItem: json
		}
	})

	after(() => mongoose.disconnect())
})
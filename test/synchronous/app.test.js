const test = require('../../src/')
	, app  = require('./app')
	, it   = test(app)

describe('Simple Synchronous Tests', () => {
	const users = []

	it.get('/users', {
		body: []
	})

	it.post('/users', {
		data: {name: 'Amine'},
		body: {name: 'Amine'},
		verify: (res, done) => {
			users.push(res.body)
			done()
		}
	})

	it.get('/users', {
		body: () => users.map(i => i)
	})
})

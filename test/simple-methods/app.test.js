const test = require('../../src/')
	, app  = require('./app')
	, it   = test(app)

describe('Simple Methods Test', () => {
	
	it.get('/hello/Amine', {
		body: {text: 'Hello Amine'}
	})
	
	it.get('/hello', {
		status: 404
	})

	it.post('/hello', {
		data: {name: 'Amine'},
		body: {text: 'Hello Amine'}
	})

	it.post('/hello', {
		status: 400,
		body: {error: 'You should provide a name'}
	})

})

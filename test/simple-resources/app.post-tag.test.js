const test = require('../../src/')
	, app  = require('./app.post-tag')
	, transform = require('wajez-transform')
	, mongoose = require('mongoose')
	, PostTag = require('./post-tag')

const json = transform({
	id: 'id',
	name: 'name'
})

describe('Simple resource', () => {
	before(() => mongoose.connect(`mongodb://localhost/chwia-api-test`))

	test(app).resource(PostTag, {
		create: ['name'],
		json: { // required
			resource: json, 
			collectionItem: json
		}
	})

	after(() => mongoose.disconnect())
})


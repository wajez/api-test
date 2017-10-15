const test = require('../../src/')
	, app  = require('./app.post-tag')
	, transform = require('wajez-transform')
	, PostTag = require('./post-tag')

const json = transform({
	id: 'id',
	name: 'name'
})

test(app).resource(PostTag, {
	create: ['name'],
	json: { // required
		resource: json, 
		collectionItem: json
	}
})

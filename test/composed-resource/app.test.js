const test = require('../../src/')
	, mongoose = require('mongoose')
	, app = require('./app')
	, transformers = require('./transformers')
	, Category = require('./category')
	, Post = require('./post')

describe('Composed resource', () => {
	before(() => mongoose.connect(`mongodb://localhost/chwia-api-test`))

	test(app).resource(Category, {
		json: { // required
			resource: transformers.categoryResource, 
			collectionItem: transformers.categoryCollectionItem
		},
		routes: {
			collection: '/categories', // default: `/${resource-name-in-plural}`
			resource: '/categories/:id' // default: `/${resource-name-in-plural}/:id`
		},
		create: ['name', 'parent'],
		children: [ // default: all array fields of ObjectId type
			{
				field: 'children',  // required
				Model: Category,   // required
				json: { // required
					resource: transformers.categoryResource, 
					collectionItem: transformers.categoryCollectionItem
				},
				reference: 'parent', // default: null; no reference!
				route: '/categories/:id/children', // default: `${routes.resource}/${field}`
				create: ['name'], // default: all non-array fields - the reference field above, if any
			},
			{
				field: 'posts',
				Model: Post,
				json: {
					resource: transformers.postResource,
					collectionItem: transformers.postCollectionItem
				}
			}
		]
	})

	after(() => mongoose.disconnect())
})
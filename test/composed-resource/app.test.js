const test = require('../../src/')
	, app = require('./app')
	, transformers = require('./transformers')

test(app).resource('Category', {
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
			json: { // required
				resource: transformers.categoryResource, 
				collectionItem: transformers.categoryCollectionItem
			},
			name: 'Category', // default: takes the type from the schema
			reference: 'parent', // default: null; no reference!
			route: '/categories/:id/children', // default: `${routes.resource}/${field}`
			create: ['name'], // default: all non-array fields - the reference field above, if any
		},
		{
			field: 'posts',
			json: {
				resource: transformers.postResource,
				collectionItem: transformers.postCollectionItem
			}
		}
	]
})

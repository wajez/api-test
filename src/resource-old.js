const R = require('ramda')
	, mongoose = require('mongoose')
	, methods  = require('./methods')
	, generate = require('./generate')
	, plural   = require('pluralize').plural
	, Rule 	   = require('./rules')
	, normalize = require('./normalize')

// Let's write some Functional code, yeah!
const children = R.pipe(
	R.prop('fields'), // {a: {type:...}, b: {type:...},... }
	R.toPairs,        // [['a', {type:...}], ['b', {type:...}]]
	R.filter(rule =>  // [['a', {type: 'array', rule: {type: 'ref', name: 'ModelA'}}], ...]
		rule[1].type == 'array' 
	 && rule[1].rule.type == 'ref'
	),
	R.map(rule =>   // [['a', ModelA], ['b', ModelB], ... ]
		[rule[0], mongoose.model(rule[1].rule.name)]
	),
	R.fromPairs     // {a: ModelA, b: ModelB, ...}
)

const routesOf = (name, childs) => {
	name = plural(name).toLowerCase()
	const routes = {}
	for(field in childs)
		routes[field] = `/${name}/:id/${field}`
	return {
		all: `/${name}`,
		add: `/${name}`,
		get: `/${name}/:id`,
		edit: `/${name}/:id`,
		remove: `/${name}/:id`,
		children: routes
	}
}

const clean = (Model, Children) => done => {
	const removes = Children.map(Child => Child.remove({}))
	Promise.all(removes)
	.then(() => Model.remove({}))
	.then(() => done())
	.catch(done)
}

const recordOf = model => generate(Rule.model(model))
const dataFor  = model => {
	const rules = Rule.model(model)
	if (model.modelName == 'Post') {
		// console.log('Fields', model.fields)
		// console.log('Rules', rules)
	}
	return generate({
		type: rules.type,
		fields: R.pick(model.fields.create, rules.fields)
	})
}

const make = name => {
	const model  = mongoose.model(name)
		, childs = children(Rule.model(model))
		, routes = routesOf(name, childs)
		
	return {name, model, children: childs, routes}
}

const resource = (app, name) => {
	const resource = make(name)
		, get    = (uri, opts) => methods.get(app, uri, opts)
		, put    = (uri, opts) => methods.put(app, uri, opts)
		, post   = (uri, opts) => methods.post(app, uri, opts)
		, remove = (uri, opts) => methods.remove(app, uri, opts)
		, listJSON   = instance => normalize(resource.model, instance)
		, singleJSON = instance => normalize(resource.model, instance, 2)

	const data = {
		parent: R.range(0, 3).map(() => dataFor(resource.model)),
		children: {}
	}

	let items = {
		parent: [],
		children: {}
	}

	for(field in resource.children) {
		data.children[field] = R.range(0, 3).map(() => dataFor(resource.children[field]))
		// console.log('Child: ', resource.children[field].modelName)
		// console.log('Generated', data.children[field])
		items.children[field] = []
	}

	const Model = resource.model
		, names = plural(name)

	describe(`Resource ${name}`, () => {
		// Removes all documents from the database
		before(clean(Model, R.values(resource.children)))

		for(const field in resource.children) {
			const Child = resource.children[field]
				, uri	= resource.routes.children[field]
				, childListJSON   = model => normalize(Child, model)
				, childSingleJSON = model => normalize(Child, model, 2)


		// 	get(resource.routes.get, {
		// 		description: `returns the first ${name} containing the added ${field}`,
		// 		params: () => items.parent[0],
		// 		body: () => {
		// 			const result = {}
		// 			result[field] = [childListJSON(items.children[field][0])]
		// 			return result
		// 		}
		// 	})

		// 	get(resource.routes.get, {
		// 		description: `returns the second ${name} containing the added ${field}`,
		// 		params: () => items.parent[1],
		// 		body: () => {
		// 			const result = {}
		// 			result[field] = [childListJSON(items.children[field][1])]
		// 			return result
		// 		}
		// 	})
		}

		remove(resource.routes.remove, {
			description: `removes the first ${name}`,
			params: () => items.parent[0],
			verify: (res, done) => {
				Model.findOne({_id: res.body.id})
				.then(item => {
					if (null !== item)
						return done('Item was not removed!')
					done()
				})
				.catch(done)
			}
		})

		get(resource.routes.get, {
			description: `fails to get the missing ${name}`,
			params: () => items.parent[0],
			status: 404
		})

		put(resource.routes.edit, {
			description: `fails to update the missing ${name}`,
			params: () => items.parent[0],
			data: {},
			status: 404
		})

		get(resource.routes.all, {
			description: `returns one ${name}`,
			body: () => [listJSON(items.parent[1])]
		})
		
		// Removes all documents from the database
		after(clean(Model, R.values(resource.children)))
	})
}

module.exports = resource

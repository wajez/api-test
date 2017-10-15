const mongoose = require('mongoose')
	, R        = require('ramda')
	, plural   = require('pluralize').plural
	, generate = require('./generate')
	, modelRules = require('./rules').model
	, {get, post, put, remove} = require('./methods')

const defaultCreate = Model => {
	const fields = modelRules(Model).fields
	const result = []
	R.keys(fields).forEach(key => {
		if (fields[key].type != 'array')
			result.push(key)
	})
	return result
}

const pluralize = word => {
	const words = word.replace(/\.?([A-Z]+)/g, (x, y) => '-' + y.toLowerCase())
		.replace(/^-/, '')
		.split('-')
	words.push(plural(words.pop()))
	return words.join('-')
}

const defaultRoutes = Model => {
	const names = pluralize(Model.modelName)
	return {
		collection: `/${names}`,
		resource: `/${names}/:id`
	}
}

const defaultChild = (Model, route, field) => {
	const names  = pluralize(Model.modelName)
		, fields = modelRules(Model).fields
	if (undefined == fields[field])
		throw Error(`The model ${Model.modelName} has no field '${field}'`)
	if (fields[field].type != 'array' || fields[field].rule.type != 'ref')
		throw Error(`The field '${field}' of model ${Model.modelName} is not an array of ObjectIds`)
	return {
		field,
		name: fields[field].rule.name, // default: takes the type from the schema
		reference: null, // default: null; no reference!
		route: route + '/' + field, // default: `${routes.resource}/${field}`
		create: defaultCreate(mongoose.model(fields[field].rule.name))
	}
}

const dataFor = (Model, fields) => {
	const rules = modelRules(Model)
	return generate({
		type: rules.type,
		fields: R.pick(fields, rules.fields)
	})
}

const make = (Model, {json, routes, create, children} = {}) => {
	routes = R.merge(defaultRoutes(Model), routes || {})
	create = create || defaultCreate(Model)
	children = (children || []).map(child =>
		R.mergeDeepRight(defaultChild(Model, routes.resource, child.field), child)
	)
	const data = R.range(0, 3).map(_ => dataFor(Model, create))
	children = children.map(child => {
		child.data  = R.range(0, 3).map(_ => dataFor(child.Model, child.create))
		return child
	})

	return {routes, data, children, json}
}

const clean = (Model, Children) => done => {
	const removes = Children.map(Child => Child.remove({}))
	Promise.all(removes)
	.then(() => Model.remove({}))
	.then(() => done())
	.catch(done)
}

const resource = (app, Model, options) => {
	const {routes, data, children, json} = make(Model, options)
	const name = Model.modelName
	const names = plural(name).toLowerCase()
	const items = {
		resources: [],
		children: {}
	}
	children.forEach(child => {
		items.children[child.field] = []
	})

	describe(`Resource ${name}`, () => {
		before(clean(Model, R.map(R.prop('Model'), children)))

		get(app, routes.collection, {
			description: `returns empty array`,
			body: []
		})

		post(app, routes.collection, {
			description: `adds a new ${name}`,
			data: data[0],
			status: 201,
			verify: (res, done) => {
				Model.findOne({_id: res.body.id})
				.then(item => {
					if (null == item)
						return done('${name} was not added!')
					items.resources.push(item)
					done()
				})
				.catch(done)
			}
		})
		get(app, routes.collection, {
			description: `returns the added ${name}`,
			body: () => items.resources.map(json.collectionItem)
		})

		get(app, routes.resource, {
			description: `returns the added ${name}`,
			params: () => items.resources[0],
			body: () => json.resource(items.resources[0])
		})

		put(app, routes.resource, {
			description: `changes the ${name}`,
			params: () => items.resources[0],
			data: data[1],
			body: () => json.resource(R.merge(json.resource(items.resources[0]), data[1])),
			verify: (res, done) => {
				Model.findOne({_id: res.body.id})
				.then(item => {
					if (null == item)
						return done('Item not found after edit!')
					items.resources[0] = item
					done()
				})
				.catch(done)
			}
		})

		post(app, routes.collection, {
			description: `adds new ${name}`,
			data: data[2],
			status: 201,
			verify: (res, done) => {
				Model.findOne({_id: res.body.id})
				.then(item => {
					if (null == item)
						return done('Item was not added!')
					items.resources.push(item)
					done()
				})
				.catch(done)
			}
		})

		get(app, routes.collection, {
			description: `returns two ${names}`,
			body: () => items.resources.map(json.collectionItem)
		})

		children.forEach(child => {

			let deleted = null
			const omittable = ['id']
			if (child.reference)
				omittable.push(child.reference)

			get(app, child.route, {
				description: `returns no ${child.field}`,
				params: () => items.resources[0],
				body: []
			})

			R.range(0, 2).forEach(i => {
				post(app, child.route, {
					description: `adds new item to ${child.field} of the ${name} ${i}`,
					params: () => items.resources[i],
					data: child.data[i],
					body: R.omit(omittable, child.json.resource(child.data[i])),
					verify: (res, done) => {
						child.Model.findOne({_id: res.body.id})
						.then(item => {
							if (null == item)
								return done('Item was not added!')
							items.children[child.field].push(item)
							if (! items.resources[i][child.field])
								items.resources[i][child.field] = []
							items.resources[i][child.field].push(item)
							if (child.Model == Model)
								items.resources.push(item)
							done()
						})
						.catch(done)
					}
				})
			})

			R.range(0, 2).forEach(i => {
				get(app, child.route, {
					description: `returns ${child.field} of ${name} ${i}`,
					params: () => items.resources[i],
					body: () => [child.json.collectionItem(items.children[child.field][i])]
				})
				get(app, routes.resource, {
					description: `returns the ${name} ${i} containing the added ${child.field}`,
					params: () => items.resources[i],
					body: () => json.resource(items.resources[i])
				})
			})
		})

		let removed = null
		remove(app, routes.resource, {
			description: `removes the first ${name}`,
			params: () => items.resources[0],
			verify: (res, done) => {
				removed = items.resources.shift()
				items.resources.forEach(resource => {
					children.forEach(child => {
						if (child.reference && child.Model == Model) {
							let referenceId = resource[child.reference]
							if (referenceId != null && referenceId.id)
								referenceId = referenceId.id
							if (referenceId == removed.id)
								resource[child.reference] = null
						}
					})
				})
				done()
			}
		})

		get(app, routes.resource, {
			description: `fails to get the missing ${name}`,
			params: () => removed,
			status: 404
		})

		put(app, routes.resource, {
			description: `fails to update the missing ${name}`,
			params: () => removed,
			data: {},
			status: 404
		})

		get(app, routes.collection, {
			description: `returns one ${name}`,
			body: () => items.resources.map(json.collectionItem)
		})

		after(clean(Model, R.map(R.prop('Model'), children)))
	})
}

module.exports = resource

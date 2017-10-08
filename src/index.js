const {get, post, put, remove} = require('./methods')
const resource = require('./resource')

module.exports = app => {
	const test = {}
	
	test.get = (uri, options) => {
		get(app, uri, options)
		return test
	}
	
	test.post = (uri, options) => {
		post(app, uri, options)
		return test
	}
	
	test.put = (uri, options) => {
		put(app, uri, options)
		return test
	}
	
	test.delete = (uri, options) => {
		remove(app, uri, options)
		return test
	}

	test.resource = (name, options) => {
		resource(app, name, options)
		return test
	}

	return test
}

const R = require('ramda')

if (undefined === Promise.object) {
	Promise.object = fields => {
		const keys = R.keys(fields)
			, values = R.values(fields)
				.map(value => (value instanceof Promise) ? value : Promise.resolve(value))
		return Promise.all(values)
			.then(results => R.zipObj(keys, results))
	}
}

if (undefined === Object.prototype.filter) {
	Object.prototype.filter = function(predicate) {
		const result = {}
		R.keys(this).forEach(key => {
			if (predicate(this[key]))
				result[key] = this[key]
		})
		return result
	}
}

if (undefined === Object.prototype.map) {
	Object.prototype.map = function(transform) {
		const result = {}
		R.keys(this).forEach(key => {
			result[key] = transform(this[key], key, this)
		})
		return result
	}
}

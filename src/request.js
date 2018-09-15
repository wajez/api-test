const R      = require('ramda')
	, chai   = require('chai')
	, validate = require('./validate')

chai.use(require('chai-http'))

const isSuccess = status => 2 == Math.floor(status / 100)

const fill = (text, object) => {
	if (! object)
		return text
	for(const attr in object) {
		text = R.replace(new RegExp(':' + attr, 'g'), object[attr], text)
	}
	return text
}

const request = (app, method, uri, {description, params, data, status, body, verify, headers}) => {

	var message = `${method.toUpperCase()} ${uri}`
	if (undefined != description)
		message += ' ' + description

	it(message, done => {
		if (R.type(headers) == 'Function')
			headers = headers()
		if (R.type(params) == 'Function')
			params = params()
		if (R.type(data) == 'Function')
			data = data()
		if (R.type(status) == 'Function')
			status = status()
		if (undefined === status)
			status = 200 // default status
		if (R.type(body) == 'Function')
			body = body()
		uri = fill(uri, params)
		let query = chai.request(app)[method](uri)
		if (headers) {
			R.keys(headers).forEach(key => {
				query.set(key, headers[key])
			})
		}
		if (undefined !== data)
	    query = query.send(data)
		query.then(res => {
			res.should.have.status(status)
			if (body != undefined)
			    validate(body, res.body)
			if (verify != undefined) {
			    return verify(res, done)
			}
			done()
		}).catch(done)
	})
}

module.exports = request

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

const request = (app, method, uri, {description, params, data, status, body, done, verify}) => {

	var message = `${method.toUpperCase()} ${uri}`
	if (undefined != description)
		message += ' ' + description

	it(message, done => {
		if (undefined === status)
			status = 200 // default status
		if (R.type(body) == 'Function')
			body = body()
		if (R.type(params) == 'Function')
			params = params()
		uri = fill(uri, params)

		let onSuccess = res => done('Failed !')
		let onFailure = done
		if (isSuccess(status)) {
		    onSuccess = res => {
		        res.should.have.status(status)
		        if (body != undefined)
		            validate(body, res.body)
		        if (verify != undefined) {
		            return verify(res, done)
		        }
		        done()
		    }
		} else {
		    onFailure = err => {
		        try {
		            const res = err.response.res
		            err.should.have.status(status)
		            if (body != undefined)
		                validate(body, res.body)
		            if (undefined != verify)
		                return verify(res, done)
		            done()
		        } catch(err) {
		            done(err)
		        }
		    }
		}
		var query = chai.request(app)[method](uri)
		if (undefined !== data)
		    query = query.send(data)
		query.then(onSuccess).catch(onFailure)
	})
}

module.exports = request
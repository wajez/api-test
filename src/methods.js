const R  	  = require('ramda')
	, request = require('./request')

const get    = (app, uri, options) => request(app, 'get',    uri, options)
const post   = (app, uri, options) => request(app, 'post',   uri, options)
const put    = (app, uri, options) => request(app, 'put',    uri, options)
const remove = (app, uri, options) => request(app, 'delete', uri, options)

module.exports = {get, post, put, remove}

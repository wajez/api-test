const express    = require('express')
	, bodyParser = require('body-parser')
    , mongoose   = require('mongoose')
	, R          = require('ramda')
    , User       = require('./user')
	, app        = express()
	, transform  = require('wajez-transform')

mongoose.Promise = global.Promise
mongoose.connect(`mongodb://localhost/chwia-api-test`, {
	useMongoClient: true
})
const db = mongoose.connection

app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}))

app.use(bodyParser.json({
    limit: '50mb'
}))

const asJSON = transform({
	id: 'id',
	name: 'name',
	email: 'email',
	token: 'token'
})

app.get('/api/users', (req, res) => {
	User.find({})
	.then(items => res.json(items.map(asJSON)))
	.catch(err => {
		console.error(err)
		res.status(500)
		res.json({})
	})
})

app.get('/api/users/:id', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(404)
	    return res.json({ error: `No user found with id '${id}'`})
	}
	User.findOne({_id: id})
	.then(item => {
		if (null === item) {
			res.status(404)
			return res.json({error: `No user found with id '${id}'`})
		}
		res.json(asJSON(item))
	})
	.catch(err => {
		console.error(err)
		res.status(500)
		res.json({})
	})
})

app.post('/api/users', (req, res) => {
	User.create(R.merge(req.body, {token: '1234567890abcde1234567890abcde1234567890abcde1234567890abcdewxyz'}))
	.then(item => res.status(201).json(asJSON(item)))
	.catch(err => {
	    console.error(err)
	    res.status(400).json({ error: `Unable to create the user`})
	})
})

app.put('/api/users/:id', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(400)
	    return res.json({ error: `Unable to find user with id '${id}'`})
	}
	User.findOneAndUpdate({_id: id}, req.body, {new: true, runValidators: true})
	.then(item => {
	    if (null == item) {
	        res.status(404)
	        return res.json({ error: `Unable to find user with id '${id}'`})
	    }
	    res.json(asJSON(item))
	})
	.catch(err => {
	    console.error(err)
	    res.status(500)
	    res.json({})
	})
})

app.delete('/api/users/:id', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    return res.json({})
	}
	User.remove({_id: id})
	.then(() => res.json())
	.catch(err => {
	    console.error(err)
	    res.status(500)
	    res.json({})
	})
})

module.exports = app

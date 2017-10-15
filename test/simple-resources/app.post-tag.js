const express    = require('express')
	, bodyParser = require('body-parser')
    , mongoose   = require('mongoose')
	, R          = require('ramda')
    , PostTag    = require('./post-tag')
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
	name: 'name'
})

app.get('/post-tags', (req, res) => {
	PostTag.find({})
	.then(items => res.json(items.map(asJSON)))
	.catch(err => {
		console.error(err)
		res.status(500)
		res.json({})
	})
})

app.get('/post-tags/:id', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(404)
	    return res.json({ error: `No tag found with id '${id}'`})
	}
	PostTag.findOne({_id: id})
	.then(item => {
		if (null === item) {
			res.status(404)
			return res.json({error: `No tag found with id '${id}'`})
		}
		res.json(asJSON(item))
	})
	.catch(err => {
		console.error(err)
		res.status(500)
		res.json({})
	})
})

app.post('/post-tags', (req, res) => {
	PostTag.create(req.body)
	.then(item => res.status(201).json(asJSON(item)))
	.catch(err => {
	    console.error(err)
	    res.status(400).json({ error: `Unable to create the tag`})
	})
})

app.put('/post-tags/:id', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(400)
	    return res.json({ error: `Unable to find tag with id '${id}'`})
	}
	PostTag.findOneAndUpdate({_id: id}, req.body, {new: true, runValidators: true})
	.then(item => {
	    if (null == item) {
	        res.status(404)
	        return res.json({ error: `Unable to find tag with id '${id}'`})
	    }
	    res.json(asJSON(item))
	})
	.catch(err => {
	    console.error(err)
	    res.status(500)
	    res.json({})
	})
})

app.delete('/post-tags/:id', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    return res.json({})
	}
	PostTag.remove({_id: id})
	.then(() => res.json())
	.catch(err => {
	    console.error(err)
	    res.status(500)
	    res.json({})
	})
})

module.exports = app

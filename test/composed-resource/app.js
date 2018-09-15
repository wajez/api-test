const express    = require('express')
	, bodyParser = require('body-parser')
  , mongoose   = require('mongoose')
	, R          = require('ramda')
  , Category   = require('./category')
  , Post   	 = require('./post')
	, app        = express()
	, transformers = require('./transformers')

mongoose.Promise = global.Promise

app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}))

app.use(bodyParser.json({
    limit: '50mb'
}))

const toResource = transformers.categoryResource
	, toCollectionItem = transformers.categoryCollectionItem
	, toCollection = R.map(toCollectionItem)

const error = res => err => {
	console.error(err)
	res.status(500)
	res.json({})
}

app.get('/categories', (req, res) => {
	Category.find({})
	.populate('parent')
	.then(items => res.json(toCollection(items)))
	.catch(error(res))
})

app.get('/categories/:id', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(404)
	    return res.json({ error: `No category found with id '${id}'`})
	}
	Category.findOne({_id: id})
	.populate('parent')
	.populate('children')
	.populate('posts')
	.then(item => {
		if (null === item) {
			res.status(404)
			return res.json({error: `No category found with id '${id}'`})
		}
		res.json(toResource(item))
	})
	.catch(error(res))
})

app.post('/categories', (req, res) => {
	Category.create(req.body)
	.then(item => res.status(201).json(toResource(item)))
	.catch(err => {
	    console.error(err)
	    res.status(400).json({ error: `Unable to create the category`})
	})
})

app.put('/categories/:id', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(400)
	    return res.json({ error: `Unable to find category with id '${id}'`})
	}
	Category.findOneAndUpdate({_id: id}, req.body, {new: true, runValidators: true})
	.populate('parent')
	.populate('children')
	.populate('posts')
	.then(item => {
	    if (null == item) {
	        res.status(404)
	        return res.json({ error: `Unable to find category with id '${id}'`})
	    }
	    res.json(toResource(item))
	})
	.catch(error(res))
})

app.delete('/categories/:id', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    return res.json({})
	}
	Category.remove({_id: id})
	.then(() => res.json())
	.catch(error(res))
})

app.get('/categories/:id/children', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(404)
	    return res.json({ error: `No category found with id '${id}'`})
	}
	Category.findOne({_id: id}).populate('children')
	.then(item => {
		if (null === item) {
			res.status(404)
			return res.json({error: `No category found with id '${id}'`})
		}
		res.json(toCollection(item.children))
	})
	.catch(error(res))
})

app.post('/categories/:id/children', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(404)
	    return res.json({ error: `No category found with id '${id}'`})
	}
	Category.findOne({_id: id})
	.then(item => {
		if (null === item) {
			res.status(404)
			return res.json({error: `No category found with id '${id}'`})
		}
		req.body.parent = item.id
		Category.create(req.body)
		.then(child => {
			item.children.push(child)
			return item.save(err => {
				if (err)
					return error(res)
				res.json(toResource(child))
			})
		})
		.catch(error(res))
	})
	.catch(error(res))
})

app.get('/categories/:id/posts', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(404)
	    return res.json({ error: `No category found with id '${id}'`})
	}
	Category.findOne({_id: id}).populate('posts')
	.then(item => {
		if (null === item) {
			res.status(404)
			return res.json({error: `No category found with id '${id}'`})
		}
		res.json(item.posts.map(transformers.postCollectionItem))
	})
	.catch(error(res))
})

app.post('/categories/:id/posts', (req, res) => {
	const id = req.params.id
	if (! id.match(/^[0-9a-fA-F]{24}$/)) {
	    res.status(404)
	    return res.json({ error: `No category found with id '${id}'`})
	}
	Category.findOne({_id: id})
	.then(item => {
		if (null === item) {
			res.status(404)
			return res.json({error: `No category found with id '${id}'`})
		}
		req.body.category = item
		Post.create(req.body)
		.then(child => {
			item.posts.push(child)
			return item.save(err => {
				if (err)
					return error(res)
				res.json(transformers.postResource(child))
			})
		})
		.catch(error(res))
	})
	.catch(error(res))
})

module.exports = app

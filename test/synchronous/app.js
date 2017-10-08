const express    = require('express')
	, bodyParser = require('body-parser')
	, chance	 = new (require('chance'))
	, app        = express()
	, users      = []

app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}))

app.use(bodyParser.json({
    limit: '50mb'
}))

app.get('/users', (req, res) => {
	res.json(users)	
})

app.post('/users', (req, res) => {
	const user = {
		id:    chance.natural(),
		name:  req.body.name,
		token: chance.string({length: 64})
	}
	users.push(user)
	setTimeout(() => {
		res.json(user)	
	}, chance.integer({min: 10, max: 100}))
})

app.listen(3003)

module.exports = app

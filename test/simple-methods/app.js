const express    = require('express')
	, bodyParser = require('body-parser')
	, app        = express()

app.use(bodyParser.json({
    limit: '50mb'
}))

app.get('/hello/:name', (req, res) => {
	res.json({text: `Hello ${req.params.name}`})
})

app.post('/hello', (req, res) => {
	const name = req.body.name
	if (undefined == name) {
		res.status(400)
		return res.json({error: 'You should provide a name'})
	}
	res.json({text: `Hello ${name}`})
})

app.listen(3001)

module.exports = app

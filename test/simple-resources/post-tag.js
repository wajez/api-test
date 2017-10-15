const mongoose = require('mongoose')
    , Schema   = mongoose.Schema

const schema = new Schema({
    name: {
    	type: String, 
    	minLength: 3,
    	maxLength: 50
    }
})

module.exports = mongoose.model('PostTag', schema)

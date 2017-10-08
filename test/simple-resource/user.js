const mongoose = require('mongoose')
    , Schema   = mongoose.Schema

const schema = new Schema({
    name: {
    	type: String, 
    	minLength: 3,
    	maxLength: 50
    },
    email: {
    	type: String,
    	match: /[a-z0-9._+-]{1,20}@[a-z0-9]{3,15}\.[a-z]{2,4}/
    },
    password: {
    	type: String,
    	minLength: 8
    },
    token: {
    	type: String,
    	minLength: 64,
    	maxLength: 64
    },
    expire: {
    	type: Date,
    	min: new Date
    }
})

const User = mongoose.model('User', schema)

module.exports = User

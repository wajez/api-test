const mongoose = require('mongoose')
	, R        = require('ramda')
	, Schema   = mongoose.Schema

const string = ({choices, match, minLength, maxLength} = {}) => ({
	type:      'string',
	choices:   choices 	 || null,
	match: 	   match 	 || null,
	minLength: minLength || 1,
	maxLength: maxLength || 255
})

const number = ({min, max} = {}) => ({
	type: 'number',
	min:  min || -1000,
	max:  max || 1000
})

const boolean = () => ({
	type: 'boolean'
})

const date = ({min, max} = {}) => ({
	type: 'date',
	min:  min || null,
	max:  max || null
})

const buffer = () => ({
	type: 'buffer'
})

const object = fields => ({
	type: 'object',
	fields: fields || {}
})

const array = (rule, {minLength, maxLength} = {}) => ({
	type: 'array',
	rule: rule || object(),
	minLength: minLength || 0,
	maxLength: maxLength || 10
})

const ref = name => ({
	type: 'ref',
	name: name
})

const cache = {} // to cache models rules
const model = Model => {
	if (undefined == cache[Model.modelName])
		cache[Model.modelName] = type(Model.schema.obj)
	return cache[Model.modelName]
}

const type = Type => {
	if (Type == String)  return string()
	if (Type == Number)  return number()
	if (Type == Date) 	 return date()

	if (Type.type == String) {
		Type.choices = Type.enum
		return string(Type)
	}
	if (Type.type == Number)  return number(Type)
	if (Type.type == Date) 	  return date(Type)

	if (Type == Boolean || Type.type == Boolean) return boolean()
	if (Type == Buffer || Type.type == Buffer)  return buffer()

	if (
		Type == Schema.Types.ObjectId
		|| Type == Schema.Types.Mixed 
		|| Type.type == Schema.Types.Mixed 
		|| R.equals(Type, {})
		|| Type === Object
	)
		return object()

	if (Type.type == Schema.Types.ObjectId)
		return ref(Type.ref)

	if (Type.constructor === Array) 
		return array(type(Type[0]))

	if (Type.constructor === Function)
		throw Error('Type not supported!')

	const fields = {}
	R.keys(Type).forEach(name => {
		fields[name] = type(Type[name])
	})
	return object(fields)
}

module.exports = {string, number, boolean, buffer, date, array, object, model, ref}

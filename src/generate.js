const chance  = new (require('chance'))
	, R       = require('ramda')
	, randexp = require('randexp').randexp

const string = ({choices, match, minLength, maxLength}) => {
	if (choices)
		match = choices.join('|')
	if (match)
		return randexp(match)

	const length = chance.integer({min: minLength, max: maxLength})
	return chance.string({length})
}

const number = ({min, max}) => chance.integer({min, max})

const boolean = () => chance.bool()

const date = ({min, max}) => {
	if (! min) {
		min = new Date()
		min.setFullYear(min.getFullYear() - 1)
	}
	if (! max) {
		max = new Date()
		max.setFullYear(max.getFullYear() + 1)
	}

	min = Math.floor(min.getTime() / 1000)
	max = Math.floor(max.getTime() / 1000)

	return new Date(1000 * chance.integer({min, max}))
}

const buffer = () => Buffer.from(chance.string())

const object = fields => {
	const result = {}
	for(const name in fields)
		result[name] = generate(fields[name])
	return result
}

const array = (rule, {minLength, maxLength}) => {
	const length = chance.integer({min: minLength, max: maxLengthx})
		, items = []
		, i = 0
	while (i < length) {
		items.push(generate(rule))
		i ++
	}
	return items
}

const generate = rule => {
	switch(rule.type) {
		case 'string':  return string(rule)
		case 'number':  return number(rule)
		case 'boolean': return boolean(rule)
		case 'buffer':  return buffer(rule)
		case 'date':    return date(rule)
		case 'object':  return object(rule.fields)
		case 'array':   return array(rule)
	}
	return null
}

module.exports = generate

const R      = require('ramda')
    , should = require('chai').should()

const validate = (rule, data) => {
    const type = R.type(rule)
    if (type == 'Function')
        should.equal(true, rule(data))
    else if (type == 'Object')
        for(attr in rule)
            validate(rule[attr], data[attr])
    else if ((null == rule || null == data) && rule != data) {
        if (null == rule)
            data.should.be.eql(rule)
        else
            rule.should.be.eql(data)
    }
    else if (data != rule)
        data.should.be.eql(rule)
}

module.exports = validate

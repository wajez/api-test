# Wajez REST API Test

[![Build Status](https://travis-ci.org/wajez/api-test.svg?branch=master)](https://travis-ci.org/wajez/api-test)
[![Coverage Status](https://coveralls.io/repos/github/wajez/api-test/badge.svg)](https://coveralls.io/github/wajez/api-test)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat)](https://github.com/wajez/api-test/blob/master/LICENSE)

Testing REST API made easy.

# Contents Table

- [What is this?](#what-is-this)

- [Installation](#installation)

- [Testing Single Route](#testing-single-route)

- [Testing REST Resources](#testing-rest-resources)

- [Changelog](#changelog)

# What is this?

This library is an attempt to make testing REST APIs easy and declarative.

# Installation

```
npm i wajez-api-test --save-dev
```

# Testing Single Route

Let's test the following simple application

**app.js**
```js
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
```

The test can be written as follows:

**app.test.js**
```js
// We start by requiring the wajez-api-test library
// and the application we want to test
const test = require('wajez-api-test')
    , app  = require('./app')

const it   = test(app) // this create a testing object for the app

// We describe the test cases
describe('Simple Methods Test', () => {
    // We test that sending a GET request to '/hello/Amine'
    // would return a success response with body cotaining
    // {text: 'Hello Amine'}
    it.get('/hello/Amine', {
        body: {text: 'Hello Amine'}
    }) // easy, nah?
    
    // We test that sending a GET request to '/hello'
    // would return a response with status 404
    it.get('/hello', {
        status: 404
    })
    
    // We test that sending a POST request to '/hello'
    // with data {name: 'Amine'}
    // would return a success response with body cotaining
    // {text: 'Hello Amine'}
    it.post('/hello', {
        data: {name: 'Amine'},
        body: {text: 'Hello Amine'}
    })

    // We test that sending a POST request to '/hello'
    // with no data
    // would return an error response with status 400
    // containing {error: 'You should provide a name'}
    it.post('/hello', {
        status: 400,
        body: {error: 'You should provide a name'}
    })

})
```

`require('wajez-api-test)` returns a function which, when given an express application, returns a testing object providing the methods: `get`, `post`, `put` and `delete`. All these methods take two parameters:

- **uri**: The URI to which the request will be sent. It can have placeholders for parameters (exemple `/users/:id`).
- **options**: to handle the request and the response, they include:
    + **description**: an optional description for the test case.
    + **headers**: headers to add to the request.
    + **data**: The data to send with the request. By default, no data is sent.
    + **params**: If the URI contains placeholders, this option is used to fill them.
    + **status**: The expected response status. The default value is `200`.
    + **body**: The expected values of some parts of the response body. The verification ignores the parts which are not specified on this option.
    + **verify**: This option can be used to do additional custom verifications on the response or to trigger some events. It's a function that is called with the response object and a callback to call when finished.

**Note**

The options `data`, `params`, `status` and `body` can be provided as functions, on that case the function is evaluated right before sending the request and the returned value is used for the option.

```js
let generatedData;
put('/users/:id', {
    description: 'Updates the user',
    paramns: {id: 1542765421},
    data: () => {
        generatedData = getRandomUserData()
        return generatedData
    },
    status: 204,
    body: () => generatedData,
    verify: (res, done) => {
        // do whatever you want with the `res`
        // if error, call done(error)
        // else, when finished call done()
    }
})
```

# Testing REST Resources

In addition to `get`, `post`, `put` and `delete` methodes, the testing object provides a `resource` method which can be used to test all basic routes of a resource.

Let's take the following Mongoose models for example:

**user.js**
```js
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
```

Assuming that our application defines RESTful routes for this model, and that it only returns the fields `id`, `name`, `email` and `token` in responses.
We also assume, that when we want to create a user, we sent the fields `name`, `email` and `password` to the API. With these assumptions, our test will be:

```js
const test = require('wajez-api-test')
    , app  = require('./app')
    , User = require('./user')
    , transform = require('wajez-transform')

// We define the function which is used to transform a 
// Mongoose Document into a json object sent on the response.
const json = transform({
    id: 'id',
    name: 'name',
    email: 'email',
    token: 'token'
})

test(app).resource(User, {
    create: ['name', 'email', 'password'],
    json: { 
        resource: json, // used when a single resource is requested
        collectionItem: json // used when a collection of resources is requested
    }
})
```

The test above will perform the following senarios:

1. Remove all users from the database.
2. Send GET `/users` and check that response status is 200 and body is empty array.
3. Generate data based on the `create` fields, respecting the Mongoose schema rules, and sends a POST `/users` than checks that the user was inserted.
4. Check that GET `/users` returns the added user.
5. Check that GET `/users/first-id` returns the added user.
6. Send PUT `/users/first-id` with other generated data and checks that the user is updated.
7. Add a other user.
8. Check that GET `/users` returns two users.
9. Send DELETE `/users/first-id` to remove the first user and checks that it was removed.
10. Check that GET `/users/first-id` fails with a status 404.
11. Check that PUT `/users/first-id` fails with a status 404.
12. Check that GET `/users` returns only the second user.
13. Remove all users from database.

Pretty cool, nah?

The full list of the `resource` options is as follows:

```js
test(app).resource(MongooseModel, {
    prefix: '/api', // optional, default ''
    routes: { // optional
        collection: '/users', // the collection route, used to get list of resources and add new ones. Default values is the model name in pluralized dashes case. (ChannelCategory => channel-categories)
        resource: '/users/:name', // the route used to get, update or delete single route. Default is `${routes.collection}/:id`
    },
    json: { // requied
        resource: document => {...}, // used when a single resource is returned.
        collectionItem: document => {...} // used when a collection of resources is requested, applied on each item of the collection.
    },
    create: ['name', 'email', 'password'], // fields which are sent to the API when creating a new resource. Default all non ref attributes are considered.
    children: [ // if the model have sub collections, those can often have 
    // their routes, for example `/users/:id/posts` to list posts of specific user and add new posts to that specific user.
        {
            field: 'posts', // required.
            Model: Post, // the mongoose model, required.
            route: '/users/:id/posts', // default `${routes.resource}/${field}`
            json: { // required.
                resource: subDocument => {...},
                collectionItem: subDocument => {...}
            },
            create: ['title', 'content'], // fields to create the sub resource
            reference: 'author' // if the sub document has a reference to its parent, use this option to specify the field name.
        },
        ...
    ] 
})
```

When `children` are specified, the following steps are added to the testing senario for each child between steps 8 and 9 above, (we take the sub model `post` as example):

1. Check that GET `/users/:id/posts` returns no posts for the first user.
2. Add new post for both users.
3. Check that GET `/users/:id/posts` returns returns the added post for each user.

# Changelog

- **Version 1.0.7**: bug fixes.
 
- **Version 1.0.6**: bug fixes.

- **Version 1.0.5**: option `prefix` added.

- **Version 1.0.4**: option `headers` added to methods `get`, `post`, `put` and `delete`.

- **Version 1.0.3**: README updated.

- **Version 1.0.1**: Passing the mongoose model to `resource` method instead of the model name.

- **Version 1.0.0**: First version with ability to test single routes and REST resources with children.

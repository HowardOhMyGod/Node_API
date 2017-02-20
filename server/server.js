const bodyParser = require('body-parser');
const express = require('express');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

const {mongoose} = require('./db/mongoose.js');
const {Todo} = require('./models/todo.js');
const {User} = require('./models/user.js');

const port = process.env.PORT || 3000;
var app = express();

app.use(bodyParser.json());

app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, PATCH, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'accept, content-type, x-parse-application-id, x-parse-rest-api-key, x-parse-session-token');
     // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
});

app.post('/todos', (req, res) => {
	var todo = new Todo({
		text: req.body.text
	});

	todo.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	})
});

app.get('/todos', (req,res) => {
	Todo.find().then((todos) => {
		res.send({todos});
	}, (e) => {
		res.status(400).send(e);
	});
});

app.get('/todos/:id', (req, res) => {
	var id = req.params.id;

	if(!ObjectID.isValid(id)){
		return res.status(404).send('2');
	}

	Todo.findById(id).then((todo) => {
		if(todo){
			return res.status(200).send({todo});
		}
		res.status(404).send('1');
	}, (e) => {
		res.status(404).send('3');
	});
});

app.delete('/todos/:id', (req, res) => {
	let id = req.params.id;

	if(!ObjectID.isValid(id)) return res.status(404).send({status: 'Invalid ID'});

	Todo.findByIdAndRemove(id).then((rmTodo) => {
		if(!rmTodo) return res.status(404).send({status: 'ID not found'});

		res.send({remove: rmTodo}).status(200);
	}).catch((e) => {
		res.status(404).send();
	});

});

app.patch('/todos/:id', (req, res) => {
	let id = req.params.id;
	let body = _.pick(req.body, ['text', 'completed']);

	if (_.isBoolean(body.completed) && body.completed){
		body.completedAt = new Date().getTime();
	} else {
		body.completed = false;
		body.completedAt = null;
	}

	if(!ObjectID.isValid(id)) return res.status(400).send({status: 'ID Invalid'});

	Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
		if(!todo) return res.status(404).send({status: 'Todo not found'})
		res.status(200).send({todo});
	}).catch(() => res.status(400).send({status: 'error'}));
});


app.listen(port, ()=>{
	console.log(`server start at port ${port}`);
})

module.exports = {
	app
}

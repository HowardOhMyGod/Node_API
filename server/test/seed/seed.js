const {Todo} = require('../../models/todo');
const {User} = require('../../models/user');
const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const todo = [
	{	_id: new ObjectID(),
		text : 'pre1', _creator: userOneId},
	{	_id: new ObjectID(),
		text: 'pre2',
		completed: true,
		completedAt: 333,
		userTwoId: userTwoId}
];

const users = [{
  _id: userOneId,
  email: 'howard@test.com',
  password: '12345',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, '123')
  }]
}, {
  _id: userTwoId,
  email: 'anna@test.com',
  password: '00000'
}]

const populateTodos = (done) => {
  Todo.remove({}).then(() =>{
		return Todo.insertMany(todo)
	}).then(() => done());
}

const populateUsers = (done) => {
  User.remove({}).then(() => {
    let userOne = new User(users[0]).save();
    let userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo])
  }).then(() => done());

}

module.exports = {
  todo,
  users,
  populateTodos,
  populateUsers
}

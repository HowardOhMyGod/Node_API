const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {app} = require('../server');
const {Todo} = require('../models/todo')
const {todo, users, populateTodos, populateUsers} = require('./seed/seed');
const {User} = require('../models/user');


beforeEach(populateTodos);
beforeEach(populateUsers);

describe('POST /todos', () => {
	it('should create a new todo', (done) => {
		var text = 'new todo';
		request(app)
			.post('/todos')
			.send({text})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
			})
			.end((err, res) => {
				if(err){
					return done(err);
				}

				Todo.find({text}).then((todos) => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe(text);
					done();
				}).catch((e) => done(e));

			});

	})

	it('should not create todo with invalid data', (done) => {
		request(app)
			.post('/todos')
			.send({})
			.expect(400)
			.end((err, res) => {
				if(err){
					return done(err);
				}

				Todo.find({}).then((todos) => {
					expect(todos.length).toBe(2);
					done()
				}).catch((e) => done(e) )
			})
	})
});

describe('GET /todos', () => {
	it('should show all todo', (done) => {
		request(app)
			.get('/todos')
			.expect(200)
			.expect((res) => {
				expect(res.body.todos.length).toBe(2);
			})
			.end(done)
	})
});

describe('GET /todos/:id', () => {
	it('should return todo by id', (done) => {
		request(app)
			.get(`/todos/${todo[0]._id.toHexString()}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(todo[0].text);
			})
			.end(done);
	});

	it('should return 404 if to not found', (done) => {
		let id = new ObjectID();

		request(app)
			.get(`/todos/${id.toHexString()}`)
			.expect(404)
			.end(done);
	});

	it('should return 404 when invalid id', (done) => {
		request(app)
			.get('/todos/123')
			.expect(404)
			.end(done);
	})
});

describe('DELETE /todos/:id', () => {
	it('should remove todo from DB', (done) => {
		let id = todo[0]._id.toHexString();

		request(app)
			.delete(`/todos/${id}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.remove._id).toBe(id);
			})
			.expect((res) => {
				Todo.findById(id).then((doc) => {
					expect(doc).toBe(null);
				}).catch((e) => done(e));
			})
			.end(done);
	});

	it('should return 404 when todo not found', (done) => {
		let id = new ObjectID();

		request(app)
			.delete(`/todos/${id}`)
			.expect(404)
			.end(done);
	});

	it('should return 404 when ID is invalid', (done) => {
		let id = '123';

		request(app)
			.delete(`/todos/${id}`)
			.expect(404)
			.end(done);
	});
})

describe('PATCH /todos/:id', () => {
	it('should update the todo', (done) => {
		let id = todo[0]._id.toHexString();

		request(app)
			.patch(`/todos/${id}`)
			.send({text: "patch from text", completed: true})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe('patch from text');
				expect(res.body.todo.completed).toBe(true);
				expect(res.body.todo.completedAt).toBeA('number');
			})
			.end(done);
	});

	it('should clear completedAt when todo is not completed', (done) => {
		let id = todo[1]._id;

		request(app)
			.patch(`/todos/${id}`)
			.send({text: "not completed yet", completed: false})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe('not completed yet');
				expect(res.body.completedAt).toNotExist();
			})
			.end(done);
	});
})

describe('GET /users/me', () => {
	it('should return user if authenticate', (done) => {
		request(app)
			.get('/users/me')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body._id).toBe(users[0]._id.toHexString())
				expect(res.body.email).toBe(users[0].email);
			})
			.end(done);
	});

	it('should return 401 when invalid token', (done) => {
		request(app)
			.get('/users/me')
			.expect(401)
			.expect((res) => {
				expect(res.body).toEqual({})
			})
			.end(done);
	})
});

describe('POST /users', () =>　{
	it('should create a user', (done) => {
		let email = 'test@test.com';
		let password = '56789';
		let id;

		request(app)
			.post('/users')
			.send({email, password})
			.expect(200)
			.expect((res) => {
				expect(res.body.email).toBe(email);
				expect(res.headers['x-auth']).toExist();
				expect(res.body._id).toExist();
			})
			.end((err) => {
				if(err) return done()

				User.findOne({email}).then((user) => {
					expect(user).toExist();
					expect(user.password).toNotBe(password);
					done();
				})
			})
			;
	});

	it('should validation error if request invalid', (done) => {
		request(app)
			.post('/users')
			.send({
				email: '123',
				password: '000'
			})
			.expect(400)
			.end(done);
	});

	it('should not create user when email in use', (done) => {
		request(app)
			.post('/users')
			.send({
				email: users[0].email,
				password: '88888'
			})
			.expect(400)
			.end(done);
	})
});

describe('POST /users/login', () => {
	it('should login user an return token', (done) => {
		request(app)
			.post('/users/login')
			.send({
				email: users[1].email,
				password: users[1].password
			})
			.expect(200)
			.expect((res) => {
				expect(res.headers['x-auth']).toExist();
			})
			.end((err, res) => {
				if(err) done()

				User.findById({_id: users[1]._id}).then((user) => {
					expect(user.tokens[0]).toInclude({
						access:'auth',
						token: res.headers['x-auth']
					});
					done();
				}).catch((e) => done(e));
			});
	});
})

const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

let userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		trim: true,
		minlength:　1,
		unique: true,
		validate: {
			validator: validator.isEmail ,
			message: '{VALUE} is not a valid email!'
		}
	},
	password: {
		type: String,
		required: true,
		trim: true,
		unique: true,
		minlength: 4
	},
	tokens: [{
		access: {
			type: String,
			required: true
		},
		token: {
			type: String,
			required: true
		}
	}]
})

userSchema.methods.toJSON = function() {
	let user = this;
	let userObj = user.toObject();

	return _.pick(userObj, ['_id', 'email']);
}
userSchema.methods.generateAuthToken = function(){
	let user = this;
	let access = 'author';
	let token = jwt.sign({_id: user._id.toHexString(), access}, '123').toString();

	user.tokens.push({access, token});

	return user.save().then(() => {
		return token;
	});
}

console.log(userSchema.methods);

var User = mongoose.model('User', userSchema);

module.exports = {
	User
}

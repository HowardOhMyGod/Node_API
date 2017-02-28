const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

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
	let access = 'auth';
	let token = jwt.sign({_id: user._id.toHexString(), access}, '123').toString();

	user.tokens.push({access, token});

	return user.save().then(() => {
		return token;
	});
}

userSchema.statics.findByToken = function (token) {
	let User = this;
	let decode;

	try{
		decode = jwt.verify(token, '123');
	}catch(e){
		return Promise.reject();
	}

	return User.findOne({
		'_id': decode._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
}

userSchema.pre('save', function(next){
	let user = this;
	let psd = user.password;

	if(user.isModified('password')){

		bcrypt.genSalt(10, function(err, salt) {
		    bcrypt.hash(psd, salt, function(err, hash) {
		        user.password = hash;
						next();
		    });
		});
	}else next();


});

var User = mongoose.model('User', userSchema);

module.exports = {
	User
}

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
	let token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

	user.tokens.push({access, token});

	return user.save().then(() => {
		return token;
	});
}

userSchema.methods.removeToken = function(token){
	let user = this;

	return user.update({
		$pull: {
			tokens: {token}
		}
	});
}

userSchema.statics.findByToken = function (token) {
	let User = this;
	let decode;

	try{
		decode = jwt.verify(token, process.env.JWT_SECRET);
	}catch(e){
		return Promise.reject();
	}

	return User.findOne({
		'_id': decode._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
}

userSchema.statics.findByCredentials = function(email, password){
	let User = this;

	return User.findOne({email}).then((user) => {
		if(!user) return Promise.reject();

		return new Promise((resolve, reject) => {
			bcrypt.compare(password, user.password, function(err, res) {
    				if (res) {
							resolve(user);
						} else {
							reject();
						}
			});
		})
	})
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

'use strict';
var crypto = require('crypto');

module.exports = {
	sessionCheck: function(redis, auth_key, res) {
		redis.get('session:' + auth_key, function(err, value) {
			if (value) {
				res.json({status:"success"});
			} else {
				res.json({status:"fail"});
			}
		});
	},
	validateUsername: function(redis, username, res) {
		redis.get('user:' + username, function(err, value) {
			if (value != null) {
				res.json({status:"fail", message:"Username is already taken."});
			} else {
				res.json({status:"success"});
			}
		});
	},
	register: function(redis, username, password, res) {
		/* if valid: insert to database */
		redis.set("user:" + username, password);

		res.json({status:"success", message:"You are successfully registered."});
	},
	login: function(redis, username, password, req, res) {
		redis.get('user:' + username, function(err, value) {
			if (value && value == password) {
				var auth_key = new Date();
				auth_key = crypto.createHash('md5').update(auth_key.toString()).digest('hex');
				redis.set('session:' + auth_key, 1);

				res.json({status:"success", auth_key:auth_key});
			} else {
				res.json({status:"fail", message:"Incorrect username or password"});
			}
		});
	},
	logout: function(redis, auth_key, res) {
		redis.del('session:' + auth_key);
		res.json({status:"success"});
	}
}
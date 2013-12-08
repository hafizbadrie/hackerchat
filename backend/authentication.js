'use strict';

module.exports = {
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
	login: function(redis, username, password, res) {
		redis.get('user:' + username, function(err, value) {
			if (value && value == password) {
				res.json({status:"success"});
			} else {
				res.json({status:"fail", message:"Incorrect username or password"});
			}
		});
	}
}
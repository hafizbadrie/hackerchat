var express 	= require('express'),
	amqp 		= require('amqp'),
	http		= require('http'),
	path		= require('path'),
	mq_con		= amqp.createConnection(),
	sockjs		= require('sockjs'),
	node_redis	= require('redis'),
	crypto		= require('crypto'),
	app			= express(),
	sock 		= sockjs.createServer(),
	pool 		= {'room':{}},
	rooms		= ['room'],
	redis 		= node_redis.createClient(),
	auth		= require('./authentication'),
	server;

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: "Xjs27dWsks097kU94820SJluqpd", key: 'hackerchat.sid'}));
app.use(app.router);

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};

redis.on('error', function(err) {
	console.log("Redis Error: " + err);
});

app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://hackerchat.hbl");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

/* User Login & Registration : START */
app.get('/session_check', function(req, res, next) {
	var auth_key = req.query.auth_key.trim();

	auth.sessionCheck(redis, auth_key, res);
});

app.get('/validate_username', function(req, res, next) {
	var username = req.query.username.trim();

	auth.validateUsername(redis, username, res);
});

app.post('/register', function(req, res, next) {
	var username = req.body.username.trim(),
		password = crypto.createHash('md5').update(req.body.password).digest('hex');

	auth.register(redis, username, password, res);
});

app.post('/login', function(req, res, next) {
	var username = req.body.username.trim(),
		password = crypto.createHash('md5').update(req.body.password).digest('hex');

	auth.login(redis, username, password, req, res);
});

app.post('/logout', function(req, res, next) {
	var auth_key = req.body.auth_key;

	auth.logout(redis, auth_key, res);
});
/* User Login & Registration : END */

sock.on('connection', function(conn) {
	pool['room'][conn.id] = conn;

	conn.on('data', function(message) {
		/* parse message to know what kind of message the server get */
		var toclient_message = {};
		message = JSON.parse(message);

		console.log(message);
		switch(message.type) {
			case 'auth_check':
				var auth_key = message.auth_key;
				redis.get('session:' + auth_key, function(err, value) {
					if (value) {
						var username = value;
						redis.sadd('conn:' + username, conn.id);
						redis.smembers('room', function(err, value) {
							var return_msg = {
								type:'auth_check_success',
								username:username,
								online_users:value
							}
							conn.write(JSON.stringify(return_msg));
						});
					} else {
						var return_msg = {
							type: 'auth_check_fail'
						}
						conn.write(JSON.stringify(return_msg));
					}
				});
				break;
			case 'login':
				var username = message.username,
					password = crypto.createHash('md5').update(message.password).digest('hex');

				redis.get('user:' + username, function(err, value) {
					if (value && value == password) {
						var auth_key = new Date();
						auth_key = crypto.createHash('md5').update(auth_key.toString()).digest('hex');
						redis.set('session:' + auth_key, username);
						redis.sadd('auth_key:' + username, auth_key);
						redis.sadd('conn:' + username, conn.id);
						redis.sadd('room', username);

						redis.smembers('room', function(err, online_users) {
							var return_msg = {type:'login_success', username:username, auth_key:auth_key, online_users:online_users};
							conn.write(JSON.stringify(return_msg));
						});
						
						redis.smembers('conn:' + username, function(err, conns) {
							var return_msg = {type:'new_user', username:username},
								keys = Object.keys(pool['room']);

							for (var i=0; i<conns.length; i++) {
								var idx = keys.indexOf(conns[i]);
								keys.splice(idx, 1);
							}

							for (var i=0; i<keys.length; i++) {
								pool['room'][keys[i]].write(JSON.stringify(return_msg));
							}
						});
					} else {
						var return_msg = {type:"login_fail", message:"Incorrect username or password"};
						conn.write(JSON.stringify(return_msg));
					}
				});
				break;
			case 'browser_exit':
				var username = message.username,
					auth_key = message.auth_key;

				redis.srem('conn:' + username, conn.id, function(err) {
					delete pool['room'][conn.id];
				});
				
				break;
			case 'logout':
				var username = message.username,
					auth_key = message.auth_key;

				redis.smembers('conn:' + username, function(err, conns) {

					for (var i=0; i<conns.length; i++) {
						if (conns[i] !== conn.id) {
							var toclient_message = {
								type:'force_exit'
							}
							pool['room'][conns[i]].write(JSON.stringify(toclient_message));
						}

						delete pool['room'][conns[i].id];
					}

					redis.del('conn:' + username);
					redis.smembers('auth_key:' + username, function(err, auth_keys) {
						for (var i=0; i<auth_keys.length; i++) {
							redis.del('session:' + auth_keys[i]);
						}

						redis.del('auth_key:' + username);

						redis.srem('room', username, function(err) {
							var toclient_message = {
								type:'user_exit',
								username:username
							}

							var keys = Object.keys(pool['room']);
							for (var i=0; i<keys.length; i++) {
								pool['room'][keys[i]].write(JSON.stringify(toclient_message));
							}
						});	
					});

				});
				break;
			case 'screenshoot':
				var keys = Object.keys(pool['room']);
				toclient_message = message;
				for (var i=0; i<keys.length; i++) {
					pool['room'][keys[i]].write(JSON.stringify(toclient_message));
				}
				break;
			case 'youtube':
				var keys = Object.keys(pool['room']);
				toclient_message = message;
				for (var i=0; i<keys.length; i++) {
					pool['room'][keys[i]].write(JSON.stringify(toclient_message));
				}
				break;
			case 'chat':
				var keys = Object.keys(pool['room']);
				toclient_message = message;
				for (var i=0; i<keys.length; i++) {
					if (keys[i] !== conn.id) {
						pool['room'][keys[i]].write(JSON.stringify(toclient_message));
					}
				}
				break;
			case 'close':
				// var idx = pool['room'].indexOf(conn);
				// pool['room'].splice(idx, 1);
				// conn.close();
				break;
		}
	});

	conn.on('close', function() {
		console.log('[CLOSE]: ' + conn);
	});
})

/* Chat Processing : START */
app.post('/sendchat', function(req, res, next) {
	if (req.body.chat == null) {
		res.json({status:'failed', message:'You need to enter a chat!'});
	} else {
		var chat 			= req.body.chat.trim(),
			chats 			= chat.split(' '),
			is_empty_exist 	= (chats.indexOf('') < 0) ? false : true;

		while(is_empty_exist) {
			var index = chats.indexOf('');
			chats.splice(index, 1);
			is_empty_exist = (chats.indexOf('') < 0) ? false : true;
		}

		var command 	= chats[0],
			is_command 	= false;

		console.log(chats);
		switch(command) {
			case '#screenshoot':
				is_command 	= true;
				mq_con.publish('screenshoot-queue', {url: chats[1], itemId: req.body.itemId});			
				break;
			case '#youtube':
				is_command 	= true;
				mq_con.publish('youtube-queue', {url: chats[1], itemId: req.body.itemId});
				break;
			case '#getimage':
				is_command 	= true;
				break;
			case '#alexa':
				is_command 	= true;
				break;
		}
		
		res.json({status:'success', is_command:is_command, command:command, itemId:req.body.itemId});
	}
});
/* Chat Processing : END */

server = http.createServer(app);
sock.installHandlers(server, {prefix:'/sock'});
server.listen(3000, function(){
  console.log('Listening on port 3000');
});

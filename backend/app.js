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
	pool 		= [],
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

sock.on('connection', function(conn) {
	pool.push(conn);

	conn.on('data', function(message) {
		/* parse message to know what kind of message the server get */
		var toclient_message = {};
		message = JSON.parse(message);

		switch(message.type) {
			case 'screenshoot':
				toclient_message = message;
				for (var i=0; i<pool.length; i++) {
					pool[i].write(JSON.stringify(toclient_message));
				}
				break;
			case 'youtube':
				toclient_message = message;
				for (var i=0; i<pool.length; i++) {
					pool[i].write(JSON.stringify(toclient_message));
				}
				break;
			case 'chat':
				toclient_message = message;
				for (var i=0; i<pool.length; i++) {
					if (pool[i] !== conn) {
						pool[i].write(JSON.stringify(toclient_message));
					}
				}
				break;
		}
	});
})

app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://hackerchat.local");
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
				command 	= '#screenshoot';
				mq_con.publish('screenshoot-queue', {url: chats[1], itemId: req.body.itemId});			
				break;
			case '#youtube':
				is_command 	= true;
				command 	= '#youtube';
				mq_con.publish('youtube-queue', {url: chats[1], itemId: req.body.itemId});
				break;
			case '#getimage':
				is_command 	= true;
				command 	= '#getimage';
				break;
			case '#alexa':
				is_command 	= true;
				command 	= '#alexa';
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
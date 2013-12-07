var amqp 		= require('amqp'),
	url			= require('url'),
	fs			= require('fs'),
	sjs			= require('sockjs-client-ws'),
	mq_con		= amqp.createConnection(),
	sjs_client	= sjs.create('http://localhost:3000/sock');

sjs_client.on('connection', function() {
	console.log('Connected to SockJS server!');
});

mq_con.on('ready', function() {
	mq_con.queue('getimage-queue', function(q) {
		q.bind('#');

		q.subscribe(function(message) {
			/* parse url */
			/* download image */
			/* send link to client */
		});
	});
});
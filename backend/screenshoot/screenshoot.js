var amqp 		= require('amqp'),
	phantomjs	= require('phantom'),
	url			= require('url'),
	fs			= require('fs'),
	sjs			= require('sockjs-client-ws'),
	sleep		= require('sleep'),
	mq_con		= amqp.createConnection(),
	sjs_client	= sjs.create('http://localhost:3000/sock');

sjs_client.on('connection', function() {
	console.log('Connected to SockJS server!');
});

mq_con.on('ready', function() {
	mq_con.queue('screenshoot-queue', function(q) {
		q.bind('screenshoot-queue');

		q.subscribe({ack:false}, function(message) {
			phantomjs.create(function(phantom) {
				phantom.createPage(function(page) {
					page.open(message.url, function(status) {
						if (status !== 'success') {
							console.log('URL is invalid or not found!');
							var sock_message = {
								type:'screenshoot',
								status:'fail',
								message:'URL is invalid or not found!',
								itemId: message.itemId
							};
						} else {
							console.log('Rendering page...');
							var curtime 	= new Date(),
								filename	= curtime.getTime() + '.png',
								fs_err		= null;
							page.render(__dirname + '/../../frontend/images/screenshoots/' + filename);
							console.log('Page rendered!');
							phantom.exit();
							var sock_message = {
								type:'screenshoot',
								status:'success',
								filepath:'http://hackerchat.local/images/screenshoots/' + filename,
								itemId: message.itemId
							};

							sleep.sleep(7);
						}

						sjs_client.send(JSON.stringify(sock_message));
					})
				});
			});
			
			/* NEXT: image processing (crop and resize) */
		});
	});
});

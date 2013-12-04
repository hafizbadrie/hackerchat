var amqp 		= require('amqp'),
	sjs			= require('sockjs-client-ws'),
	url			= require('url'),
	mq_con		= amqp.createConnection(),
	sjs_client	= sjs.create('http://localhost:3000/sock');

sjs_client.on('connection', function() {
	console.log('Connected to SockJS server!');
});

mq_con.on('ready', function() {
	mq_con.queue('youtube-queue', function(q) {
		q.bind('#');

		q.subscribe(function(message) {
			var youtube_url = url.parse(message.url, true),
				video_id 	= '',
				sock_msg 	= {};
			if (youtube_url.hostname == 'www.youtube.com' || youtube_url.hostname == 'youtube.com') {
				video_id = youtube_url.query.v;
				sock_msg = {
					type:'youtube',
					status:'success',
					video_id:video_id,
					itemId: message.itemId
				};
			} else if (youtube_url.hostname == 'youtu.be') {
				var paths = youtube_url.pathname.split('/');
				video_id = paths[1];
				sock_msg = {
					type:'youtube',
					status:'success',
					video_id:video_id,
					itemId: message.itemId
				};
			} else {
				sock_msg = {
					type:'youtube',
					status:'fail',
					message:"It's not a valid youtube url",
					itemId: message.itemId
				};
			}

			sjs_client.send(JSON.stringify(sock_msg));
		});
	});
});
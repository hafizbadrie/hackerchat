/** @jsx React.DOM */
var sockjs = new SockJS('http://localhost:3000/sock');

var ChatBox = React.createClass({
	render: function() {
		var chat_line = function(sent_chat) {
			return <li>{sent_chat.itemText} <div id={sent_chat.itemId}></div></li>;
		}
		return <ul id="chats">{this.props.items.map(chat_line)}</ul>;
	}
});

var SendChat = React.createClass({
	getInitialState: function() {
		return {items:[], text:''};
	},
	onChange: function(e) {
		this.setState({text: e.target.value});
	},
	onClick: function(e) {
		e.preventDefault();
		var curdate = new Date(),
			getTime = curdate.getTime(),
			chat_items = this.state.items.concat([{itemText:this.state.text, itemId:getTime}]),
			chat = this.state.text,
			cleared_chat = '';
		this.setState({items: chat_items, text: cleared_chat});

		$.ajax({
			type:"POST",
			url:"http://localhost:3000/sendchat",
			data:{
				chat:chat,
				itemId:getTime
			},
			dataType:"json",
			success:function(response) {
				/* if it's a command chat, then it will do something to the chat box */
				if (response.is_command) {
					if (response.command == '#screenshoot') {
						$("#" + response.itemId).html('<em>system is currently capturing the web page</em>');
					} else if (response.command = '#youtube') {
						$("#" + response.itemId).html('<em>system is currently preparing the video</em>');
					}
				}

				var payload = {
					type:'chat',
					server_res: response,
					chat:chat
				};
				sockjs.send(JSON.stringify(payload));
			}
		});
	},
	render: function() {
		return (
			<div>
				<div className="row">
					<div className="col-md-12 chat-box">
						<ChatBox items={this.state.items} />
					</div>
				</div>
				<div className="row chat-actions">
					<div className="col-md-11">
						<textarea onChange={this.onChange} id="chat-input" value={this.state.text}></textarea>
					</div>
					<div className="col-md-1">
						<a href="#" id="send-chat" className='btn btn-primary' onClick={this.onClick}>Send</a>
					</div>
				</div>
			</div>
		);
	}
});

React.renderComponent(<SendChat />, document.getElementById('chat-panel'));

sockjs.onmessage = function(e) {
	var obj = JSON.parse(e.data);
	if (obj.type == 'screenshoot') {
		if (obj.status == 'success') {
			$("#" + obj.itemId).html('<img src="' + obj.filepath + '" width="700" />');
		} else {
			$("#" + obj.itemId).html('<em>' + obj.message + '</em>');
		}
	} else if (obj.type == 'youtube') {
		if (obj.status == 'success') {
			$("#" + obj.itemId).html('<iframe width="420" height="315" src="//www.youtube.com/embed/' + obj.video_id + '" frameborder="0" allowfullscreen></iframe>');
		} else {
			$("#" + obj.itemId).html('<em>' + obj.message + '</em>');
		}
	} else if (obj.type == 'chat') {
		if (obj.server_res.is_command) {
			if (obj.server_res.command == '#screenshoot') {
				$("#chats").append('<li>' + obj.chat + ' <div id="' + obj.server_res.itemId + '"><em>system is currently capturing the web page</em></div></li>');
			}
		} else {
			$("#chats").append('<li>' + obj.chat + '</li>');
		}
	}
}
/** @jsx React.DOM */
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
			cleared_chat = '';
		this.setState({items: chat_items, text: cleared_chat});

		$.ajax({
			type:"POST",
			url:"http://localhost:3000/sendchat",
			data:{
				chat:this.state.text,
				itemId:getTime
			},
			dataType:"json",
			success:function(response) {
				/* if it's a command chat, then it will do something to the chat box */
				if (response.is_command) {
					if (response.command == '#screenshoot') {
						$("#" + response.itemId).html('<em>system is currently capturing the web page</em>');
					}
				}
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


var sockjs = new SockJS('http://localhost:3000/sock');
sockjs.onmessage = function(e) {
	console.log(e);
	var obj = JSON.parse(e.data);
	if (obj.type == 'screenshoot') {
		if (obj.status == 'success') {
			$("#" + obj.itemId).html('<img src="' + obj.filepath + '" width="700" />');
		} else {
			$("#" + obj.itemId).html('<em>' + obj.message + '</em>');
		}
	}
}
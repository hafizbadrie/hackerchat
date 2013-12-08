/** @jsx React.DOM */
var sockjs = new SockJS('http://localhost:3000/sock');

var RegisterBox = React.createClass({
	getInitialState: function() {
		return {username:'', password:'', confirmPassword:''}
	},
	onUsernameChange: function(e) {
		var react_obj = this,
			$reg_btn  = document.getElementById('register-btn');
		this.setState({username: e.target.value});

		if (this.state.username.length > 5) {
			$.ajax({
				type:"GET",
				url:"http://localhost:3000/validate_username?username=" + e.target.value,
				dataType:"json",
				success:function(response) {
					if (response.status == 'fail') {
						console.log('Username is already taken!');
						$reg_btn.disabled = true;
					} else {
						console.log('Username is okay!');
						$reg_btn.disabled = false;
					}
				}
			});
		}
	},
	onPasswordChange: function(e) {
		if (e.target.value != this.state.confirmPassword) { 
			this.setState({confirmPassword: ''});
		}

		if (e.target.value.length < 6) {
			console.log('Password must be 6 characters of length');
			this.setState({confirmPassword: ''});
		} else {
			console.log('Password is okay!');
			this.setState({password: e.target.value});
		}
	},
	onConfirmPasswordChange: function(e) {
		var $reg_btn = document.getElementById('register-btn');

		this.setState({confirmPassword: e.target.value});
		if (e.target.value != this.state.password && e.target.value != '') {
			console.log('Confirm password is not equal with Password');
			$reg_btn.disabled = true;
		} else {
			console.log('Confirm password is okay!');
			$reg_btn.disabled = false;
		}
	},
	onSubmit: function(e) {
		e.preventDefault();
		var react_obj = this,
			$username = document.getElementById('username'),
			$password = document.getElementById('password'),
			$confirm_password = document.getElementById('confirm-password'),
			$reg_btn = document.getElementById('register-btn');

		if ($username.value == '' || $password.value == '' || $confirm_password == '' || $password.value != $confirm_password.value) {
			console.log('Validation fail! Nothing to do!');
		} else {
			$.ajax({
				type:"POST",
				url:"http://localhost:3000/register",
				data:{
					username:this.state.username,
					password:this.state.password
				},
				dataType:"json",
				success:function(response) {
					if (response.status == 'success') {
						React.renderComponent(<LoginBox registerMessage={response.message} />, document.getElementById('main-panel'));
					} else {
						console.log('Registration fail!');
					}
				}
			});
		}
	},
	showLogin: function(e) {
		React.renderComponent(<LoginBox />, document.getElementById('main-panel'));
	},
	render: function() {
		return(
			<div>
				<div className="row">
					<div className="col-md-12">
						<form method="post" className="form-horizontal" role="form" action="http://localhost:3000/register">
							<h3>Register</h3>
							<br/>
							<div className="form-group">
							{this.state.registerMessage}
							</div>
							<div className="form-group">
								<label for="username" className="col-sm-2">Username</label>
								<div className="col-sm-3">
									<input onChange={this.onUsernameChange} type="text" className="form-control" id="username" name="username" placeholder="Enter username ..."/>
								</div>
							</div>
							<div className="form-group">
								<label for="password" className="col-sm-2">Password</label>
								<div className="col-sm-3">
									<input onChange={this.onPasswordChange} type="password" className="form-control" id="password" name="password" placeholder="Enter password ..."/>
								</div>
							</div>
							<div className="form-group">
								<label for="confirm-password" className="col-sm-2">Confirm Password</label>
								<div className="col-sm-3">
									<input onChange={this.onConfirmPasswordChange} value={this.state.confirmPassword} type="password" className="form-control" id="confirm-password" placeholder="Confirm your password ..."/>
								</div>
							</div>
							<button type="submit" className="btn btn-primary" id="register-btn" onClick={this.onSubmit}>Register</button>
							or <a href='#' onClick={this.showLogin}>Login</a>
						</form>
					</div>
				</div>
			</div>
		);
	}
});

var LoginBox = React.createClass({
	getInitialState: function() {
		return {username:'', password:'', registerMessage:''}
	},
	onUsernameChange: function(e) {
		this.setState({username: e.target.value});
	},
	onPasswordChange: function(e) {
		if (e.target.value.length < 6) {
			console.log('Password must be 6 characters of length');
		} else {
			console.log('Password is okay!');
			this.setState({password: e.target.value});
		}
	},
	onSubmit: function(e) {
		e.preventDefault();
		var react_obj = this,
			$username = document.getElementById('username'),
			$password = document.getElementById('password'),
			$login 	  = document.getElementById('login-btn');
		
		$username.disabled = true;
		$password.disabled = true;
		$login.disabled = true;
		$.ajax({
			type:"POST",
			url:"http://localhost:3000/login",
			data:{
				username:this.state.username,
				password:this.state.password
			},
			dataType:"json",
			success:function(response) {
				if (response.status == "success") {
					console.log('Logged in');
					react_obj.state.username = '';
					react_obj.state.password = '';
					$username.value = '';
					$password.value = '';

					alert('Logged in');
				} else {
					console.log('Not logged in');
				}

				
				$username.disabled = false;
				$password.disabled = false;
				$login.disabled = false;
			}
		});
	},
	showRegister:function(e) {
		React.renderComponent(<RegisterBox />, document.getElementById('main-panel'));
	},
	render: function() {
		return (
			<div>
				<div className="row">
					<div className="col-md-12">
						<form method="post" className="form-horizontal" role="form" action="http://localhost:3000/login">
							<h3>Login</h3>
							<br/>
							<div className="form-group">
								<label for="username" className="col-sm-2">Username</label>
								<div className="col-sm-3">
									<input onChange={this.onUsernameChange} type="text" className="form-control" id="username" name="username" placeholder="Enter username ..."/>
								</div>
							</div>
							<div className="form-group">
								<label for="password" className="col-sm-2">Password</label>
								<div className="col-sm-3">
									<input onChange={this.onPasswordChange} type="password" className="form-control" id="password" name="password" placeholder="Enter password ..."/>
								</div>
							</div>
							<button type="submit" className="btn btn-primary" onClick={this.onSubmit} id="login-btn">Login</button>
							or <a href='#' onClick={this.showRegister}>Register</a>
						</form>
					</div>
				</div>
			</div>
		);
	}
});

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

//React.renderComponent(<SendChat />, document.getElementById('chat-panel'));
React.renderComponent(<LoginBox />, document.getElementById('main-panel'));

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
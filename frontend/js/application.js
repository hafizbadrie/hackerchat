/** @jsx React.DOM */
function getCookie(c_name) {
	var c_value = document.cookie;
	var c_start = c_value.indexOf(" " + c_name + "=");
	if (c_start == -1) {
		c_start = c_value.indexOf(c_name + "=");
	}

	if (c_start == -1) {
		c_value = null;
	} else {
		c_start = c_value.indexOf("=", c_start) + 1;
		var c_end = c_value.indexOf(";", c_start);
		if (c_end == -1) {
			c_end = c_value.length;
		}

		c_value = unescape(c_value.substring(c_start,c_end));
	}

	return c_value;
}

function setCookie(c_name, value, exdays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value = escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie = c_name + "=" + c_value;
}

var sockjs = new SockJS('http://localhost:3000/sock'),
	$main_panel = document.getElementById('main-panel'),
	app_auth_key;

var RegisterBox = React.createClass({
	getInitialState: function() {
		return {
			username:'', 
			password:'', 
			confirmPassword:'',
			usernameErr:false,
			usernameClass:'form-group',
			passwordClass:'form-group',
			confirmPasswordClass:'form-group',
			invalidAlert:'alert alert-danger hidden'

		}
	},
	isValidState: function() {
		if (this.state.username != '' && this.state.password != '' && this.state.confirmPassword != '' && this.state.password == this.state.confirmPassword) {
			return true;
		} else {
			return false;
		}
	},
	onUsernameChange: function(e) {
		var react_obj = this;
		this.setState({username: e.target.value});

		if (this.state.username.length > 5) {
			$.ajax({
				type:"GET",
				url:"http://localhost:3000/validate_username?username=" + e.target.value,
				dataType:"json",
				success:function(response) {
					if (response.status == 'fail') {
						react_obj.setState({usernameErr:true, usernameClass:'form-group has-error'});
					} else {
						react_obj.setState({usernameErr:false, usernameClass:'form-group has-success'});
					}
				}
			});
		}
	},
	onPasswordChange: function(e) {
		if (e.target.value != this.state.confirmPassword) { 
			this.setState({confirmPasswordClass:'form-group has-error'});
		}

		if (e.target.value.length < 6) {
			this.setState({confirmPassword:'', passwordClass:'form-group has-error'});
		} else {			
			this.setState({password: e.target.value, passwordClass:'form-group has-success'});
		}
	},
	onConfirmPasswordChange: function(e) {
		this.setState({confirmPassword: e.target.value});
		if (e.target.value != this.state.password && e.target.value != '') {
			this.setState({confirmPasswordClass:'form-group has-error'});
		} else {
			this.setState({confirmPasswordClass:'form-group has-success'});
		}
	},
	onSubmit: function(e) {
		e.preventDefault();
		var react_obj = this,
			$username = document.getElementById('username'),
			$password = document.getElementById('password'),
			$confirm_password = document.getElementById('confirm-password'),
			$reg_btn = document.getElementById('register-btn');

		if (!this.state.usernameErr && this.state.username != '' && this.state.password != '' && this.state.confirmPassword != '' && this.state.password == this.state.confirmPassword) {
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
						React.unmountComponentAtNode($main_panel);
						React.renderComponent(<LoginBox registerMessage={response.message} showMessage='alert alert-success' />, $main_panel);
					} else {
						console.log('Registration fail!');
					}
				}
			});
		} else {
			this.setState({invalidAlert:'alert alert-danger'});
		}
	},
	showLogin: function(e) {
		React.unmountComponentAtNode($main_panel);
		React.renderComponent(<LoginBox />, $main_panel);
	},
	render: function() {
		return(
			<div>
				<div className="row">
					<div className="col-md-12">
						<form method="post" className="form-horizontal" role="form" action="http://localhost:3000/register">
							<h3>Register</h3>
							<br/>
							<div className={this.state.invalidAlert}>Invalid data, please fill in valid data</div>
							<div className={this.state.usernameClass}>
								<label for="username" className="col-sm-2">Username</label>
								<div className="col-sm-3">
									<input onChange={this.onUsernameChange} type="text" className="form-control" id="username" name="username" placeholder="Enter username ..."/>
								</div>
							</div>
							<div className={this.state.passwordClass}>
								<label for="password" className="col-sm-2">Password</label>
								<div className="col-sm-3">
									<input onChange={this.onPasswordChange} type="password" className="form-control" id="password" name="password" placeholder="Enter password ..."/>
								</div>
							</div>
							<div className={this.state.confirmPasswordClass}>
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
		return {username:'', password:''}
	},
	getDefaultState: function() {
		return {showMessage:'alert alert-success hidden', registerMessage:''}
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
					react_obj.state.username = '';
					react_obj.state.password = '';
					$username.value = '';
					$password.value = '';

					setCookie('auth_key', response.auth_key);
					React.unmountComponentAtNode($main_panel);
					React.renderComponent(<ChatPanel />, $main_panel);
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
		React.unmountComponentAtNode($main_panel);
		React.renderComponent(<RegisterBox />, $main_panel);
	},
	render: function() {
		return (
			<div>
				<div className="row">
					<div className="col-md-12">
						<form method="post" className="form-horizontal" role="form" action="http://localhost:3000/login">
							<h3>Login</h3>
							<br/>
							<div className={this.props.showMessage}>{this.props.registerMessage}</div>
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

var ChatPanel = React.createClass({
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
			<div className="row">
				<div className="col-md-3 command-chat">
					<h2>Command Chat</h2>
					<ul>
						<li><strong>#screenshoot</strong>: use this command chat to capture a web page</li>
						<li><strong>#youtube</strong>: use this command chat to share a youtube video</li>
						<li><strong>#getimage</strong>: use this command chat to share an image</li>
						<li><strong>#alexa</strong>: use this command chat to retrieve alexa data of a site</li>
					</ul>

					<h2>Todo</h2>
					<ul>
						<li>Persist chat in redis</li>
						<li>Scrolling interaction</li>
						<li>Getimage module</li>
						<li>Skin polish</li>
						<li>Learn reactjs more to remove unnecessary jQuery code</li>
					</ul>
				</div>
				<div className="col-md-9" id="chat-panel">
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
			</div>
		);
	}
});

/* check session */
app_auth_key = getCookie('auth_key');
if (app_auth_key == '' || app_auth_key == undefined) {
	React.renderComponent(<LoginBox />, $main_panel);
} else {
	$.ajax({
		type:"GET",
		url:"http://localhost:3000/session_check?auth_key=" + app_auth_key,
		dataType:"json",
		success:function(response) {
			if (response.status == 'success') {
				React.renderComponent(<ChatPanel />, $main_panel);
			} else {
				React.renderComponent(<LoginBox />, $main_panel);
			}
		}
	})
}

sockjs.onmessage = function(e) {
	var obj  = JSON.parse(e.data)
		node = $("#" + obj.itemId);
	if (obj.type == 'screenshoot') {
		if (obj.status == 'success') {
			node.html('<img src="' + obj.filepath + '" width="700" />');
		} else {
			node.html('<em>' + obj.message + '</em>');
		}
	} else if (obj.type == 'youtube') {
		if (obj.status == 'success') {
			node.html('<iframe width="420" height="315" src="//www.youtube.com/embed/' + obj.video_id + '" frameborder="0" allowfullscreen></iframe>');
		} else {
			node.html('<em>' + obj.message + '</em>');
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
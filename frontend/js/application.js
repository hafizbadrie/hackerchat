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

var sockjs,
	$main_panel = document.getElementById('main-panel'),
	app_auth_key,
	online_users = [],
	current_user;

sockjs = new SockJS('http://localhost:3000/sock');
sockjs.onopen = function(e) {
	/* check session */
	console.log('asdfasdf');
	app_auth_key = getCookie('auth_key');
	if (app_auth_key == undefined || app_auth_key == '') {
		React.renderComponent(<LoginBox />, $main_panel);
	} else {
		var payload = {
			type: 'auth_check',
			auth_key: app_auth_key
		};

		sockjs.send(JSON.stringify(payload));
	}
}

sockjs.onmessage = function (e) {
	var obj  = JSON.parse(e.data)
		node = $("#" + obj.itemId);

	if (obj.type == 'login_fail') {
		console.log('[LOGIN FAIL]');

	} else if (obj.type == 'login_success') {
		setCookie('auth_key', obj.auth_key);
		online_users = obj.online_users;
		current_user = obj.username;
		React.unmountComponentAtNode($main_panel);
		React.renderComponent(<ChatPanel username={obj.username} onlineUsers={online_users} authKey={obj.auth_key} />, $main_panel);

		console.log('[SELF]: ' + online_users);

	} else if (obj.type == 'auth_check_fail') {
		React.unmountComponentAtNode($main_panel);
		React.renderComponent(<LoginBox />, $main_panel);

		console.log('[AUTH FAIL]');

	} else if (obj.type == 'auth_check_success') { 
		var chats = '';
		online_users = obj.online_users;
		current_user = obj.username;
		React.unmountComponentAtNode($main_panel);
		React.renderComponent(<ChatPanel username={obj.username} onlineUsers={online_users} authKey={obj.auth_key} />, $main_panel);

		$.each(obj.chats, function(index, obj_chat) {
			var chat = JSON.parse(obj_chat);

			if (chat.username == current_user) {
				chats += '<li class="owner">' + chat.chat + ' <div class="username">' + chat.username + '</div></li>'
			} else {
				chats += '<li class="user">' + chat.chat + ' <div class="username">' + chat.username + '</div></li>'
			}
		});
		$("#chats").html(chats);

		console.log('[AUTH SUCCESS]: ' + current_user);
	} else if (obj.type == 'user_exit') {
		var exit_username_idx = online_users.indexOf(obj.username);
		current_user = null;
		online_users = [];
		app_auth_key = null;
		$(".room-" + obj.username).parent().remove();

		console.log('[USER LOGOUT]: ' + obj.username);

	} else if (obj.type == 'new_user') {
		var new_username = obj.username;
		online_users.push(new_username);
		$(".online-users").append('<li><a href="#" class="room-' + new_username + '">' + new_username + '</a></li>');

		console.log('[OTHER]: ' + online_users);

	} else if (obj.type == 'force_exit') {
		current_user = null;
		online_users = [];
		app_auth_key = null;

		setCookie('auth_key', null);
		React.unmountComponentAtNode($main_panel);
		React.renderComponent(<LoginBox />, $main_panel);

		console.log('[FORCE EXIT]');

	} else if (obj.type == 'screenshoot') {
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
			$("#chats").append('<li class="' + obj.chatType + '">' + obj.chat + ' <div class="username">' + obj.username + '</div></li>');
		}

	}
};

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
			<div className="container">
				<div className="row">
					<div className="register-box">
						<form method="post" role="form" action="http://localhost:3000/register">
							<div className={this.state.invalidAlert}>Invalid data, please fill in valid data</div>
							<div className={this.state.usernameClass}>
								<label for="username" className="col-sm-12">Username</label>
								<div className="col-sm-12">
									<input onChange={this.onUsernameChange} type="text" className="form-control" id="username" name="username" placeholder="Enter username ..."/>
								</div>
							</div>
							<div className={this.state.passwordClass}>
								<label for="password" className="col-sm-12">Password</label>
								<div className="col-sm-12">
									<input onChange={this.onPasswordChange} type="password" className="form-control" id="password" name="password" placeholder="Enter password ..."/>
								</div>
							</div>
							<div className={this.state.confirmPasswordClass}>
								<label for="confirm-password" className="col-sm-12">Confirm Password</label>
								<div className="col-sm-12">
									<input onChange={this.onConfirmPasswordChange} value={this.state.confirmPassword} type="password" className="form-control" id="confirm-password" placeholder="Confirm your password ..."/>
								</div>
							</div>
							<div className="form-action">
								<button type="submit" className="btn btn-primary" id="register-btn" onClick={this.onSubmit}>Register</button>
								or <a href='#' onClick={this.showLogin}>Login</a>
							</div>
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
	getDefaultProps: function() {
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
		console.log('LOGIN SUBMIT');
		var react_obj = this,
			$username = document.getElementById('username'),
			$password = document.getElementById('password'),
			$login 	  = document.getElementById('login-btn');
		
		$username.disabled = true;
		$password.disabled = true;
		$login.disabled = true;

		var payload = {
			type:'login',
			username:this.state.username,
			password:this.state.password
		};
		sockjs.send(JSON.stringify(payload));

		this.setState({username: '', password: ''});
		$username.value = '';
		$password.value = '';
		$username.disabled = false;
		$password.disabled = false;
		$login.disabled = false;
	},
	showRegister:function(e) {
		React.unmountComponentAtNode($main_panel);
		React.renderComponent(<RegisterBox />, $main_panel);
	},
	render: function() {
		return (
			<div className="container">
				<div className="row">
					<div className="login-box">
						<form method="post" role="form" action="http://localhost:3000/login">
							<div className={this.props.showMessage}>{this.props.registerMessage}</div>
							<div className="form-group">
								<label for="username" className="col-sm-12">Username</label>
								<div className="col-sm-12">
									<input onChange={this.onUsernameChange} type="text" className="form-control" id="username" name="username" placeholder="Enter username ..."/>
								</div>
							</div>
							<div className="form-group">
								<label for="password" className="col-sm-12">Password</label>
								<div className="col-sm-12">
									<input onChange={this.onPasswordChange} type="password" className="form-control" id="password" name="password" placeholder="Enter password ..."/>
								</div>
							</div>
							<div className="form-action">
								<button type="submit" className="btn btn-primary" onClick={this.onSubmit} id="login-btn">Login</button>
								or <a href='#' onClick={this.showRegister}>Register</a>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}
});

var UsersBox = React.createClass({
	render: function() {
		var online_user = function(user) {
			var className = "room-" + user;
			return <li><a href="#" className={className}>{user}</a></li>
		}
		return <ul className="online-users">{this.props.users.map(online_user)}</ul>;
	}
});

var ChatBox = React.createClass({
	render: function() {
		var chat_line = function(sent_chat) {
			return <li className={sent_chat.itemType}>{sent_chat.itemText} <div id={sent_chat.itemId}>{sent_chat.commandResult}</div> <div className='username'>{sent_chat.itemUsername}</div></li>;
		}
		//return <ul id="chats">{this.props.items.map(chat_line)}</ul>;
		return <ul id="chats"></ul>;
	}
});

var ChatPanel = React.createClass({
	getInitialState: function() {
		return {items:[], text:''};
	},
	getDefaultProps: function() {
		return {username:'', authKey:'', onlineUsers:[]};
	},
	handleLogout: function(e) {
		e.preventDefault();
		
		var auth_key  = this.props.authKey,
			react_obj = this;

		var payload = {
			type:'logout',
			username:current_user,
			auth_key:app_auth_key
		}
		sockjs.send(JSON.stringify(payload));
		setCookie('auth_key', null);
		React.unmountComponentAtNode($main_panel);
		React.renderComponent(<LoginBox />, $main_panel);
	},
	onChange: function(e) {
		this.setState({text: e.target.value});
	},
	onKeyPress: function(e) {
		if (e.keyCode === 13) {
			this.onClick(e);
		}
	},
	onClick: function(e) {
		e.preventDefault();;

		var curdate 		= new Date(),
			getTime 		= curdate.getTime(),
			react_obj 		= this,
			current_user	= this.props.username
			chat_items 		= this.state.items.concat([{itemUsername:this.props.username, itemType:'owner', itemText:this.state.text, itemId:getTime, commandResult:''}]),
			chat 			= this.state.text,
			auth_key 		= this.props.authKey,
			cleared_chat 	= '';

		if (chat !== '') {
			this.setState({items: chat_items, text: cleared_chat});
			$("#chats").append('<li class="owner">' + chat + ' <div class="username">' + current_user + '</div></li>');

			$.ajax({
				type:"POST",
				url:"http://localhost:3000/sendchat",
				data:{
					chat:chat,
					username:current_user,
					itemId:getTime,
					auth_key:auth_key
				},
				dataType:"json",
				success:function(response) {
					/* if it's a command chat, then it will do something to the chat box */
					if (response.is_command) {
						console.log(chat_items[chat_items.length-1]);
						if (response.command == '#screenshoot') {
							chat_items[chat_items.length-1].commandResult = <em>system is currently capturing the web page</em>;
						} else if (response.command = '#youtube') {
							chat_items[chat_items.length-1].commandResult = <em>system is currently preparing the video</em>;
						}
						react_obj.setState({items: chat_items});
					}

					var payload = {
						type:'chat',
						server_res: response,
						chat:chat,
						username:current_user
					};
					sockjs.send(JSON.stringify(payload));
				}
			});
		}
	},
	render: function() {
		return (
			<div className="row no-margin">
				<div className="col-md-3 left-panel">
					<div className="current-user">
						<p>Hello, <span className="font-bold">{this.props.username}</span> | <a href='#' onClick={this.handleLogout}>Logout</a></p>
					</div>

					<h2 className="online-user-header"><span className="glyphicon glyphicon-user"></span> Online Users</h2>
					<UsersBox users={this.props.onlineUsers} />
				</div>
				<div className="col-md-9" id="chat-panel">
					<div className="row no-margin">
						<div className="col-md-12 chat-box">
							<ChatBox items={this.state.items} />
						</div>
					</div>
					<div className="row chat-actions no-margin">
						<div className="col-md-11">
							<textarea onChange={this.onChange} id="chat-input" value={this.state.text} onKeyPress={this.onKeyPress}></textarea>
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

window.onbeforeunload = function(e) {
	if (app_auth_key !== undefined) {
		var user_idx = online_users.indexOf(current_user);
		online_users.splice(user_idx, 1);
		var payload = {
			type: 'browser_exit',
			auth_key: app_auth_key,
			username: current_user
		};
		sockjs.send(JSON.stringify(payload));
	}
}

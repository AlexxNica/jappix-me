/*
 * Jappix Me - Your public profile, anywhere
 * New profile page
 * 
 * License: AGPL
 * Author: Valérian Saliou
 */


// Credentials storage
var USER_USERNAME = '';
var USER_DOMAIN = '';
var USER_PASSWORD = '';

// XMPP connected handler
function handleConnected() {
	// Change status
	if((typeof(con) != 'undefined') && con && con.connected()) {
		// Stop waiter
		$('#content .step:not(.disabled) .stepped .status').removeClass('network').text('Connected.');
	}
	
	// Switch to next step!
	$('#content .step .stepped form input').attr('disabled', true);
	$('#content .step').eq(1).addClass('disabled');
	$('#content .step').eq(2).removeClass('disabled');
	$('#content .step').eq(2).find('button').removeAttr('disabled');
	
	window.location.hash = 'step3';
}

// XMPP error handler
function handleError() {
	$('#content .step:not(.disabled) .stepped .status').removeClass('network').text('Wrong credentials.');
	$('#content .step .stepped form input').removeAttr('disabled');
}

// Server bot creation request
function submitBot() {
	// Send the bot a request
	$('#content .step:not(.disabled) .stepped .status').addClass('network').text('Adding to queue…').show();
	
	$.post('/new/bot', {usr: USER_USERNAME, srv: USER_DOMAIN, pwd: USER_PASSWORD}, function(data) {
		// Any error?
		if(data != 'OK') {
			$('#content .step:not(.disabled) .stepped .status').removeClass('network').text(data);
			
			return;
		}
		
		// Job done!
		$('#content .step:not(.disabled) .stepped .status').removeClass('network').text('Done.');
		
		// Next step
		var next_step = (((typeof(con) != 'undefined') && con && con.connected())) ? 3 : 4;

		$('#content .step').eq(2).addClass('disabled');
		$('#content .step').eq(2).find('button').attr('disabled', true);
		$('#content .step').eq(next_step).removeClass('disabled');

		if(next_step == 3) {
			$('#content .step').eq(next_step).find('button').removeAttr('disabled');
		}
		
		// Redirect
		window.location.hash = 'step4';
	});
}

// Converts a JS array to a serialized PHP one
function jsArrayToPHP(a) {
	var a_php = '';
	var total = 0;
	
	for(var key in a)  {
		++total;
		
		a_php = a_php + 's:' + String(key).length + ':"' + String(key) + '";s:' + String(a[key]).length + ':"' + String(a[key]) + '";';
    }
	
	a_php = 'a:' + total + ':{' + a_php + '}';
	
	return a_php;
}

// Gets the user friend list
function listInviteFriends() {
	$('#content .step:not(.disabled) .stepped .status').addClass('network').text('Getting friend list…').show();
	
	var iq = new JSJaCIQ();
	
	iq.setType('get');
	iq.setQuery(NS_ROSTER);
	
	con.send(iq, handleInviteFriends);
}

// Handles the user friend list
function handleInviteFriends(iq) {
	var users = [];
	
	$(iq.getQuery()).find('item').each(function() {
		var current_user = $(this).attr('jid');
		
		if(current_user.match(/@/) && !current_user.match(/%/) && !current_user.match(/\\40/) && !Utils.existArrayValue(users, current_user)) {
			users.push(current_user);
		}
	});
	
	inviteFriends('invite', users);
}

// Sends the invite messages
function sendInviteFriends(users) {
	var app_url = $('#config input[name="app-url"]').val();

	if(users && users.length) {
		for(var i in users) {
			var mess = new JSJaCMessage();
			
			mess.setTo(users[i]);
			mess.setSubject('Join me on Jappix Me!');
			mess.setType('normal');
			mess.setBody('Hey, I just created my Jappix Me profile! Jappix Me is a free tool to create your own public profile, using your social channel and lots of information from your XMPP account.\n\nIf you want to see my profile, visit: ' + app_url + USER_USERNAME + '@' + USER_DOMAIN + ' which will be soon available!\n\nJoin us on ' + app_url + ' and create your own profile for free! ;-)\n\n\n*This is an automated message, sent to you because one of your friends invited his buddy list to join him on Jappix Me. You will not receive it twice.*');
			
			con.send(mess);
		}
	}
	
	// Job done!
	var invite_result = 'All done.';
	
	if(users.length == 1) {
		invite_result = '1 friend invited.';
	} else if(users.length > 1) {
		invite_result = users.length + ' friends invited.';
	}
	
	$('#content .step:not(.disabled) .stepped .status').removeClass('network').text(invite_result);
	
	// Last step
	$('#content .step').eq(3).addClass('disabled');
	$('#content .step').eq(3).find('button').attr('disabled', true);
	$('#content .step').eq(4).removeClass('disabled');
	
	// Reveal the link to the profile
	$('#content .step .stepped .reveal a').attr('href', app_url + USER_USERNAME.htmlEnc() + '@' + USER_DOMAIN.htmlEnc());
	$('#content .step .stepped .reveal a').html(app_url + '<b>' + USER_USERNAME.htmlEnc() + '@' + USER_DOMAIN.htmlEnc() + '</b>');
	$('#content .step .stepped .reveal').fadeIn('slow');
	
	window.location.hash = 'step5';
}

// Friend invite request
function inviteFriends(mode, users) {
	// Skip?
	if(mode == 'skip') {
		var app_url = $('#config input[name="app-url"]').val();

		// Last step
		$('#content .step').eq(3).addClass('disabled');
		$('#content .step').eq(3).find('button').attr('disabled', true);
		$('#content .step').eq(4).removeClass('disabled');
		
		// Reveal the link to the profile
		$('#content .step .stepped .reveal a').attr('href', app_url + USER_USERNAME.htmlEnc() + '@' + USER_DOMAIN.htmlEnc());
		$('#content .step .stepped .reveal a').html(app_url + '<b>' + USER_USERNAME.htmlEnc() + '@' + USER_DOMAIN.htmlEnc() + '</b>');
		$('#content .step .stepped .reveal').fadeIn('slow');
		
		window.location.hash = 'step5';
		
		return false;
	}
	
	// Send the bot a request
	$('#content .step:not(.disabled) .stepped .status').addClass('network').text('Sending invite messages…').show();
	
	$.post('/new/invite', { list: jsArrayToPHP(users) }, function(data) {
		var to_invite = [];
		
		$(data).find('user').each(function() {
			var current_push = $(this).text();
			
			if(current_push && !Utils.existArrayValue(to_invite, current_push)) {
				to_invite.push(current_push);
			}
		});
		
		// Send messages
		sendInviteFriends(to_invite);

		// Disconnect from XMPP (not needed then)
		con.disconnect();
	});
}

$(document).ready(function() {
	// Enable first input
	$('#content .step').eq(0).find('input').removeAttr('disabled');
	
	// Disabled click event
	$('*').click(function() {
		if($(this).parent().hasClass('disabled')) {
			return false;
		}
	});
	
	// Form event
	$('#content .step .stepped input.read').click(function() {
		$(this).attr('disabled', true);

		$('#content .step').eq(0).addClass('disabled');
		$('#content .step').eq(1).removeClass('disabled');
		$('#content .step').eq(1).find('input').removeAttr('disabled');
		$('#content .step').eq(1).find('input:first').focus();
		
		window.location.hash = 'step2';
	});
	
	$('#content .step .stepped form').submit(function() {
		// Read data
		var address = $(this).find('input.[name=address]').val();
		var password = $(this).find('input.[name=password]').val();
		
		if(!address || !password) {
			return false;
		}
		
		var username, domain;
		
		if(address.indexOf('@') != -1) {
			// A domain is specified
			username = Common.getXIDNick(address);
			domain = Common.getXIDHost(address);
		} else {
			// Quick address input
			username = address;
			domain = 'jappix.com';
		}
		
		username = username.toLowerCase();
		domain = domain.toLowerCase();
		
		// Read config
		var config_bot_domain = $('#config input[name="bot-domain"]').val();
		var config_xmpp_bosh = $('#config input[name="xmpp-bosh"]').val();
		var config_xmpp_websocket = $('#config input[name="xmpp-websocket"]').val();

		// Not allowed using given server?
		if((domain == 'gmail.com') || (domain == 'googlemail.com') || (domain == 'chat.facebook.com')) {
			$('#content .step:not(.disabled) .stepped .status').removeClass('network').text('Server not eligible. Must be ' + config_bot_domain).show();
			
			return false;
		}

		// Store credentials
		USER_USERNAME = username;
		USER_DOMAIN = domain;
		USER_PASSWORD = password;

		// Lock credentials
		$(this).find('input').attr('disabled', true);
		
		// Can check credentials? (domain allowed by BOSH)
		if(domain == config_bot_domain) {
			// Connect
			if(config_xmpp_websocket && typeof window.WebSocket != 'undefined') {
				con = new JSJaCWebSocketConnection({
					httpbase: config_xmpp_websocket
				});
			} else {
				con = new JSJaCHttpBindingConnection({
					httpbase: config_xmpp_bosh
				});
			}

			con.registerHandler('onconnect', handleConnected);
			con.registerHandler('onerror', handleError);
			
			con.connect({
				username: username,
				domain: domain,
				resource: 'Jappix Me (WB' + (new Date()).getTime() + ')',
				pass: password,
				secure: true,
				xmllang: 'en'
			});

			// Waiter
			$('#content .step:not(.disabled) .stepped .status').addClass('network').text('Connecting…').show();
		} else {
			handleConnected();
		}

		return false;
	});
	
	$('#content .step .stepped button.create').click(function() {
		$(this).attr('disabled', true);
		submitBot();
	});
	
	$('#content .step .stepped button.invite').click(function() {
		$(this).attr('disabled', true);
		listInviteFriends();
	});
	
	$('#content .step .stepped .skip a').click(function() {
		if($(this).parent().parent().parent().hasClass('disabled')) {
			return false;
		}
		
		return inviteFriends('skip');
	});
	
	// Apply placeholder
	$('input[placeholder], textarea[placeholder]').placeholder();
});
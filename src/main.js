const Discord = require('discord.js');
const client = new Discord.Client();

const auth = require('./auth.json');

client.on('ready', () =>  {
	console.log("I am ready!");
});

client.on('message', message => {
	if(message.content === 'ping') {
		message.reply('pong');
	}
});

client.login(auth.token)
	.then(atoken => console.log('Logged in with token: ' + atoken))
	.catch(console.error);

const conns = [];

client.on('message', m => {
	if(m.content.startsWith('/join')) {
		const channelId = m.content.split(' ')[1];
		const msgChannels = m.guild.channels;
		const channelToJoin = msgChannels.get(channelId);
		if(channelToJoin && channelToJoin.type === 'voice') {
			if(conns !== undefined && conns[0] !== undefined && conns[0].channel === channelToJoin) {
				console.log('Already connected to channel ' + channelToJoin);
			} else {
				channelToJoin.join()
					.then(connection => {
						console.log('Connected to channel ' + channelToJoin.name);
						conns.push(connection);
					})
					.catch(connection => console.log('Unable to connect to channel ' + channelToJoin.name));
			}
		}
	}
	if(m.content.startsWith('/leave')) {
		if(conns !== undefined && conns[0] !== undefined) {
			conns[0].disconnect();
			console.log("Left voice channel " + conns[0].channel);
			conns.splice(0,1);
		} else {
			console.log('Not connected to any channel');
		}
	}
});
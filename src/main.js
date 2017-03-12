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

client.on('message', m => {
	if(m.content.startsWith('/join')) {
		const channelId = m.content.split(' ')[1];
		const msgChannels = m.guild.channels;
		const channelToJoin = msgChannels.get(channelId);
		if(channelToJoin && channelToJoin.type === 'voice') {
			channelToJoin.join()
				.then(connection => console.log('Connected to channel ' + channelToJoin.name))
				.catch(connection => console.log('Unable to connect to channel ' + channelToJoin.name));
		}
	}
	if(m.content.startsWith('/leave')) {
		m.reply(client.voiceConnections);
	}
});
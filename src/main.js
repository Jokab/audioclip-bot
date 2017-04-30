'use strict'

const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');
const VoiceConnection = require('./voiceconnection.js');
const clipper = require('./clipper.js');

client.on('ready', () =>  {
	console.log("I am ready!");
});

client.login(auth.token)
	.then(atoken => console.log('Logged in with token: ' + atoken))
	.catch(console.error);

const conns = new Map();

client.on('message', m => {
	if(m.content.startsWith('/join')) {
		const channelToJoin = m.guild.channels.get(m.content.split(' ')[1]) || m.member.voiceChannel;
		if(channelToJoin && channelToJoin.type === 'voice') {
			if(conns.has(m.guild.id) && conns.get(m.guild.id).connection.channel === channelToJoin) {
				console.log('Already connected to voice channel ' + channelToJoin.name);
			} else {
				channelToJoin.join().then(connection => {
						console.log('Successfully connected to channel ' + channelToJoin.name);
						conns.set(m.guild.id, new VoiceConnection(client, connection));
					})
					.catch(error => console.log('Unable to connect to channel ' + channelToJoin.name + '. Error: ' + error));
			}
		}
	}

	if(m.content.startsWith('/leave')) {
		if(conns.has(m.guild.id)) {
			conns.get(m.guild.id).disconnect();
			conns.delete(m.guild.id);
		} else {
			console.log('Can\'t leave when not connected to a channel');
		}
	}

	if(m.content.startsWith('/rec')) {
		const args = m.content.split(' ');
		if(args.length < 2) {
			m.reply('Please specify a user to record');
		} else {
			const userName = args[1];
			const userId = lookupUser(userName, m.guild);
			if(userId === undefined) {
				console.log('User to record does not seem to exist');
			} else {
				console.log('Listening to voice of user ' + userName + ' (ID: ' + userId + ')');
				conns.get(m.guild.id).record(userId);
			}
		}
	}

	if(m.content.startsWith('/play')) {
		const seconds = getSeconds(m);
		clipper.doClip(conns.get(m.guild.id, seconds, m.channel), seconds, m.channel, clipper.clipHandlers.PLAY_VOICE);
	}

	if(m.content.startsWith('/clip')) {
		const seconds = getSeconds(m);
		clipper.doClip(conns.get(m.guild.id, seconds, m.channel), seconds, m.channel, clipper.clipHandlers.UPLOAD_VOICE);
	}
});

function getSeconds(message) {
	const maxSeconds = 60;
	const defaultSec = 30;
	var secondsToPlay = message.content.split(' ')[1];
	if(secondsToPlay === undefined) {
		secondsToPlay = defaultSec;		
	} else {
		if(secondsToPlay > maxSeconds) {
			console.log(`Not playing more than #{maxSeconds} seconds. Defaulting to #{maxSeconds}.`);
			secondsToPlay = maxSeconds;
		} else {
			secondsToPlay = parseInt(secondsToPlay);
		}
	}

	return secondsToPlay;
}

function lookupUser(userName, guild) {
	const memberList = guild.members;
	return memberList.keyArray().find(key => memberList.get(key).user.username === userName);
}

function playYoutube() {
	const ytdl = require('ytdl-core');
	const streamOptions = { seek: 0, volume: 1 };
    const stream = ytdl('https://www.youtube.com/watch?v=XAWgeLF9EVQ', {filter : 'audioonly'});
  	console.log(stream);
    const dispatcher = conns[0].playStream(stream, streamOptions);
}

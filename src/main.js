'use strict'

const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');
const fs = require('fs');
const pcmUtil = require('pcm-util');
const AudioBuffer = require('audio-buffer');
const abUtil = require('audio-buffer-utils');
const Readable = require('stream').Readable
const aws = require('./aws.js');
const ffmpeg = require('fluent-ffmpeg');

client.on('ready', () =>  {
	console.log("I am ready!");
});

client.login(auth.token)
	.then(atoken => console.log('Logged in with token: ' + atoken))
	.catch(console.error);

const conns = {};

client.on('message', m => {
	if(m.content.startsWith('/join')) {
		const channelToJoin = m.guild.channels.get(m.content.split(' ')[1]) || m.member.voiceChannel;
		if(channelToJoin && channelToJoin.type === 'voice') {
			if(conns[m.guild.id] !== undefined && conns[m.guild.id].channel === channelToJoin) {
				console.log('Already connected to voice channel ' + channelToJoin.name);
			} else {
				channelToJoin.join()
					.then(connection => {
						console.log('Successfully connected to channel ' + channelToJoin.name);
						conns[m.guild.id] = connection;
					})
					.catch(connection => console.log('Unable to connect to channel ' + channelToJoin.name));
			}
		}
	}

	if(m.content.startsWith('/leave')) {
		if(conns[m.guild.id] !== undefined) {
			conns[m.guild.id].disconnect();
			console.log("Left voice channel " + conns[m.guild.id].channel.name);
			delete conns[m.guild.id];
		} else {
			console.log('Can\'t leave when not connected to a channel');
		}
	}
	if(m.content.startsWith('/rec')) {
		const args = m.content.split(' ');
		if(args.length < 2) {
			console.log('Please specify a user to record');
		} else {
			const userName = args[1];
			const userId = lookupUser(userName, m.guild);
			if(userId === undefined) {
				console.log('User to record does not seem to exist');
			} else {
				console.log('Listening to voice of user ' + userName + ' (ID: ' + userId + ')');
				recVoice(userId, m.guild.id);
			}
		}
	}

	if(m.content.startsWith('/play')) {
		const seconds = getSeconds(m);
		doClip(seconds, m.channel, playVoice);
	}

	if(m.content.startsWith('/clip')) {
		const seconds = getSeconds(m);
		console.log(seconds);
		doClip(seconds, m.channel, uploadVoice);
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

let streams = [];
function recVoice(userId, guildId) {
    if (conns[guildId] !== undefined) {
        var receiver = conns[guildId].createReceiver();
        conns[guildId].on('speaking', (user, speaking) => {
        	console.log('speaking? ' + speaking);
            if (speaking) {
                var stream = receiver.createPCMStream(userId);
                streams.push(stream);
            }
        });
    }
}

/**
 * Play `seconds` of the currently collected streams to the current voice
 * connection in the specified guild.
 * @param  {int} seconds The amount of seconds to play
 * @param  {[type]} guildId The guild in which voice will be played to the
 * available voice connection.
 */
function doClip(seconds, textChannel, clipHandler) {
	// Need to wait for reading from stream to fully finish before
	// attempting to edit it
	processStream(streams, function(buffers) {
		// Need to concatenate the buffers to make pcm-util and audio-buffers
		// read them correctly
		const shorterStream = editBuffer(Buffer.concat(buffers), seconds);
		
		// Pushing an extra null here is necessary in order to make the stream pipeable
		shorterStream.push(null);

		// Do something with the clipped audio
		clipHandler(shorterStream, textChannel);
	});
}

function uploadVoice(stream, textChannel) {
	const outputFile = 'libfile.mp3';

	saveStream(stream, outputFile).then(() => {
		aws.upload(outputFile)
		.then((fileUrl) => {
			textChannel.sendMessage('File uploaded! URL: ' + fileUrl);
		})
		.catch((error) => console.log(error));
	}).catch((error) => console.log(error));
}

function playVoice(stream, guildId) {
	conns[guildId].playConvertedStream(stream);
}

function processStream(streams, callback) {
	var bufs = [];
	var finished = 0;
	const initialStreamsLength = streams.length;
	for(var i = 0; i < initialStreamsLength; ++i) {
		var s = streams.shift();
		s.on('data', function(d) { 
			bufs.push(d); 
		});
		s.on('end', function() {
			if(++finished === initialStreamsLength) {
				callback(bufs);
			}
		});
	}
}

function saveStream(stream, fileName, callback) {
	// Need to specify how the input stream is built. In this example we use
	// signed 16-bit little endian PCM audio at 44100Hz and two channels
	return new Promise((resolve, reject) => {
		var command = ffmpeg()
			.input(stream)
			.inputOptions([
				'-f s16le',
				'-ar 44.1k',
				'-ac 2'])
			.audioCodec('libmp3lame')
			.on('error', (err) => {
				reject(err);
			})
			.on('end', () => {
				console.log("Finished saving file.");
				resolve();
			})
			.save(fileName)
	});
}

function editBuffer(buffer, seconds) {
	const defaultSampleRate = pcmUtil.defaults.sampleRate;
	var audioBuf = pcmUtil.toAudioBuffer(buffer);
	var modifiedBuffer = abUtil.slice(audioBuf,0,seconds*defaultSampleRate);
	var shorterBuffer = pcmUtil.toBuffer(modifiedBuffer);
	var shorterStream = new Readable();
	shorterStream.push(shorterBuffer);

	return shorterStream;
}

function playYoutube() {
	const ytdl = require('ytdl-core');
	const streamOptions = { seek: 0, volume: 1 };
    const stream = ytdl('https://www.youtube.com/watch?v=XAWgeLF9EVQ', {filter : 'audioonly'});
  	console.log(stream);
    const dispatcher = conns[0].playStream(stream, streamOptions);
}

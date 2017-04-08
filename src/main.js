const Discord = require('discord.js');
const client = new Discord.Client();

const auth = require('./auth.json');
const fs = require('fs');
const pcmUtil = require('pcm-util');
const AudioBuffer = require('audio-buffer');

const Readable = require('stream').Readable

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
	if(m.content.startsWith('/rec')) {
		//console.log(conns[0].channel.speakable);
		// play streams using ytdl-core
		//playYoutube();

		recNextVoice();
	}
});
// 163947791729557504
// 
let streams = [];
function recNextVoice() {
    if (conns !== undefined && conns[0] !== undefined) {
        receiver = conns[0].createReceiver();
        conns[0].on('speaking', (user, speaking) => {
        	console.log('speaking? ' + speaking);
            if (speaking) {
                stream = receiver.createPCMStream("163947791729557504");
                streams.push(stream);
            } else {
            	s = streams.pop();
            	var bufs = [];
				s.on('data', function(d){ bufs.push(d); });
				s.on('end', function(){
				  	var buf = Buffer.concat(bufs);
	            	audioBuf = pcmUtil.toAudioBuffer(buf);
	            	abUtil = require('audio-buffer-utils');
	            	shorterBuffer = pcmUtil.toBuffer(abUtil.slice(audioBuf,0,audioBuf.length/2));
	            	shorterStream = new Readable();
	            	shorterStream.push(shorterBuffer);
	            	console.log(shorterStream);
					conns[0].playConvertedStream(shorterStream);
				});
            }
        });
    }
}

function playYoutube() {
	const ytdl = require('ytdl-core');
	const streamOptions = { seek: 0, volume: 1 };
    const stream = ytdl('https://www.youtube.com/watch?v=XAWgeLF9EVQ', {filter : 'audioonly'});
  	console.log(stream);
    const dispatcher = conns[0].playStream(stream, streamOptions);
}

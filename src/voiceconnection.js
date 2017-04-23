'use strict'
const VoiceChannelMonitor = require('./usermonitor.js')

class VoiceConnection {
	constructor(client, connection) {
		this.connection = connection;
		this.client = client;
		this.streams = new Map();

		this.monitor = new VoiceChannelMonitor(client, connection.channel);
		this.monitor.on('userJoined', (guildMember) => {
			this.record(guildMember);
		});

		this.monitor.on('userLeft', (guildMember) => {
			this.stopRecording(guildMember);
		});
	}

	record(guildMember) {
		console.log("recording!", guildMember.user.username);
        const receiver = this.connection.createReceiver();
        this.connection.on('speaking', (user, speaking) => {
        	console.log('speaking? ' + speaking);
            if (speaking) {
                var stream = receiver.createPCMStream(guildMember);
                if(!this.streams.has(user)) this.streams.set(user, []);
                this.streams.get(user).push(stream);
            }
        });
	}

	stopRecording(guildMember) {
		console.log("stopped recording!", guildMember.user.username)
	}

	disconnect() {
		console.log("Left channel", this.connection.channel.name);
		this.connection.disconnect();
		this.monitor.removeAllListeners(); 
	}
}

module.exports = VoiceConnection;

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
	processStream(streams).then((buffers) => {
		// Need to concatenate the buffers to make pcm-util and audio-buffers
		// read them correctly
		const shorterStream = editBuffer(Buffer.concat(buffers), seconds);
		
		// Pushing an extra null here is necessary in order to make the stream pipeable
		shorterStream.push(null);

		// Do something with the clipped audio
		clipHandler(shorterStream, textChannel);
	}).catch((error) => console.log(error));
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

function processStream(streams) {
	var bufs = [];
	var finished = 0;
	const initialStreamsLength = streams.length;

	return new Promise((resolve, reject) => {
		for(var i = 0; i < initialStreamsLength; ++i) {
			var s = streams.shift();
			s.on('data', function(d) { 
				bufs.push(d); 
			});
			s.on('end', function() {
				if(++finished === initialStreamsLength) {
					resolve(bufs);
				}
			});
			s.on('error', (error) => {
				reject(error);
			})
		}		
	});
}

function saveStream(stream, fileName) {
	// Need to specify how the input stream is built. In this example we use
	// signed 16-bit little endian PCM audio at 48kHz and two channels
	// Note: Input audio stream is actually 44.1kHz, but we need to tell it to use
	// 48kHz to make it sound 'normal' (else frequency is too low and it sounds
	// a lot lower pitch than the person's normal speaking voice) 
	return new Promise((resolve, reject) => {
		var command = ffmpeg()
			.input(stream)
			.inputOptions([
				'-f s16le',
				'-ar 48k',
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
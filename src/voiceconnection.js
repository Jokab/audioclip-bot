'use strict'
const VoiceChannelMonitor = require('./usermonitor.js')

function StreamPart(startTime, stream) {
	this.startTime = startTime;
	this.stream = stream;
	this.buffer = [];
}

class VoiceConnection {
	constructor(client, connection) {
		this.connection = connection;
		this.client = client;
		this.streams = [];
		this.receiver = this.connection.createReceiver();
		this.start = Date.now();
		this.i = 0;

		this.monitor = new VoiceChannelMonitor(client, connection.channel);
		this.monitor.on('userJoined', (guildMember) => {
			this.record(guildMember.id);
		});

		this.monitor.on('userLeft', (guildMember) => {
			this.stopRecording(guildMember.id);
		});
	}

	record(userId) {
		console.log("recording!", userId);
        this.connection.on('speaking', (user, speaking) => {
        	console.log('speaking? ', speaking, user.username);
            if (speaking) {
                var stream = this.receiver.createPCMStream(user.id);
                const startTime = (Date.now() - this.start) / 1000;
                this.streams.push(new StreamPart(startTime, stream));        	
            } else {
            }
        });
	}

	stopRecording(userId) {
		console.log("stopped recording!", userId)
	}

	disconnect() {
		console.log("Left channel", this.connection.channel.name);
		this.connection.disconnect();
		this.receiver.destroy();
		this.monitor.removeAllListeners(); 
	}


}

module.exports = VoiceConnection;


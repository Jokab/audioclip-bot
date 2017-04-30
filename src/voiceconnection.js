'use strict'
const VoiceChannelMonitor = require('./usermonitor.js')

class VoiceConnection {
	constructor(client, connection) {
		this.connection = connection;
		this.client = client;
		this.streams = [];

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
        const receiver = this.connection.createReceiver();
        this.connection.on('speaking', (user, speaking) => {
        	console.log('speaking? ' + speaking);
            if (speaking) {
                var stream = receiver.createPCMStream(userId);
                this.streams.push(stream);
            }
        });
	}

	stopRecording(userId) {
		console.log("stopped recording!", userId)
	}

	disconnect() {
		console.log("Left channel", this.connection.channel.name);
		this.connection.disconnect();
		this.monitor.removeAllListeners(); 
	}
}

module.exports = VoiceConnection;


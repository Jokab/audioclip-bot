'use strict'
const VoiceChannelMonitor = require('./usermonitor.js')

class VoiceConnection {
	constructor(client, connection) {
		this.connection = connection;
		this.client = client;

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
'use strict'
const VoiceChannelMonitor = require('./usermonitor.js')

class VoiceConnection {
	constructor(client, connection) {
		this.connection = connection;
		this.client = client;
		this.streams = [];
		this.receiver = this.connection.createReceiver();
		this.start = 0;

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
            	this.start = Date.now();
                var stream = this.receiver.createPCMStream(user.id);
                //console.log(stream);
                stream.on('end', () => {
                	console.log((Date.now() - this.start) / 1000);
                });
                this.streams.push(stream);
                console.log(this.streams.length);
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


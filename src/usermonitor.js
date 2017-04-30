'use strict'
const EventEmitter = require('events');

class VoiceChannelMonitor extends EventEmitter {

	constructor(client, channel) {
		super();
		client.on('voiceStateUpdate', (oldMember, newMember) => {
			if(newMember.voiceChannel === channel) {
				this.emit('userJoined', newMember);
			} else if(oldMember.voiceChannel === channel) {
				this.emit('userLeft', oldMember);
			}
		});

		this.on('removeListener', () => console.log("oh no they removed us!!"));
	};
}

module.exports = VoiceChannelMonitor;
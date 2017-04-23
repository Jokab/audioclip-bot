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
	};
}

module.exports = VoiceChannelMonitor;
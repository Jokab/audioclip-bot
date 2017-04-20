'use strict'

var AWS = require('aws-sdk');
const fs = require('fs');
//var uuid = require('node-uuid');

function upload(file) {
	var s3 = new AWS.S3({signatureVersion: 'v4'});

	fs.readFile(file, function(err,data) {
		var params = {
			Bucket: 'audioclip-bot', 
			Key: 'test.wav', 
			Body: data,
			ACL: 'public-read',
			ContentType: 'audio/wav'
		};

		s3.upload(params, function(err,data) {
			console.log("uploading!");
			console.log(err,data);
		});
	});
}

exports.upload = upload;
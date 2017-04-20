'use strict'

var AWS = require('aws-sdk');
const fs = require('fs');
//var uuid = require('node-uuid');

function upload(file) {
	var s3 = new AWS.S3({signatureVersion: 'v4'});



	return new Promise((resolve, reject) => {
		fs.readFile(file, function(err,data) {
			if(err !== null) {
				reject(err);
			}
			var params = {
				Bucket: 'audioclip-bot', 
				Key: 'test.wav', 
				Body: data,
				ACL: 'public-read',
				ContentType: 'audio/wav'
			};

			s3.upload(params, function(err,data) {
				console.log("Upload completed!");
				if(err === null) {
					resolve(data.Location);
				} else {
					reject(err);
				}
			});
		});
	});
}

exports.upload = upload;
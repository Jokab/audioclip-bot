'use strict'

const AWS = require('aws-sdk');
const fs = require('fs');

function upload(file) {
	var s3 = new AWS.S3({signatureVersion: 'v4'});

	return new Promise((resolve, reject) => {
		fs.readFile(file, function(err,data) {
			if(err !== null) {
				reject(err);
			}
			var params = {
				Bucket: 'audioclip-bot', 
				Key: file, 
				Body: data,
				ACL: 'public-read', // anyone can read the file
				ContentType: 'audio/wav' // enables playing in browser from link
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
'use_strict'
const AWS = require('aws-sdk');
const fs = require('fs');
const uuid = require('uuid');
const async = require('async');
var Timer = require('timer-machine');

var awsConfig = {
  'key': process.env.AWS_ACCESS_KEY_ID,
  'secret': process.env.AWS_SECRET_ACCESS_KEY,
  'sign_version': 4
}

s3 = new AWS.S3(awsConfig);

bucket = process.env.TEST_BUCKET
fileName = 'clientPhoto.jpg';
maxItems = 10;

if (!process.env.TEST_BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("Missing required env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, TEST_BUCKET")
  process.exit(1)
}

var uploadFile = function (fileName, bucket, keyPrefix, callback) {
  myTimer.stop();
  myTimer.start();
  fs.readFile(fileName,  function(err, data) {
    var headers, key;
    if (err) {
      return callback(err);
    }
    key = keyPrefix + "/" + fileName;

    headers = {
      Bucket: bucket,
      Key: key,
      Body: data,
      ServerSideEncryption: "AES256"
    };

    s3.putObject(headers, function(err, response) {
      if (err) {
        return callback(err, null);
      }
      timeTaken = myTimer.timeFromStart();
      console.log(`${bucket}/${key} uploaded: #{timeTaken} ms.`);
      return callback(err, {
        Key: key,
        response: response,
        timeTaken: timeTaken
      });
    })
  })
};

var callback = function(err, results) {
  myTimer.stop();
  myTimer.start();
  total = myTimer.time();
  if (err) {
    console.error("ERROR", err);
    process.exit(1)
  } else {

    console.log(`Done, Uploaded: ${results.length} files, total time: ${total}`);
  }
}


uploadFiles = []
for (var i = 0; i < maxItems; i++) {
  uploadFiles.push({'fileName': fileName, 'Key': uuid.v1(), 'timeTaken': 0})
}

var myTimer = new Timer();
myTimer.start();

async.concatSeries(uploadFiles, function(item, done) {
    uploadFile(item.fileName, bucket, item.Key, function(err, response) {
      if (err) {
        console.error("ERROR:", err)
      }
      done(err, response)
    });
  }, callback)

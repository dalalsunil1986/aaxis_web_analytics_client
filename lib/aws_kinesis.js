var CONFIG = require('../config/config');

/**
 * Module that interface with AWS Kinesis
 * @param object AWS the AWS instance using AWS sdk
 */
var AWS_KINESIS = (function (config) {
    "use strict";


    /**
     * Initialized credentials
     * @param object aws the instance of Amazon SDK
     */
    function get(AWS) {
        if (!AWS) {
            throw new Error("AWS SDK object is required.");
        }

        AWS = AWS;
        AWS.config.update({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        });
        AWS.config.region = config.region;

        return new AWS.Kinesis();
    }

    /**
     * Actual function that saves data to the stream
     * @param object kinesis the kinesis object
     * @param object the record object to save
     */
    function saveRecord(kinesis, record) {
        record.StreamName = config.streamName;
        record.PartitionKey = getPartitionKey(config.shards);
        kinesis.putRecord(record, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Successfully sent record with sequence " + data.SequenceNumber);
            }
        });
    }

    /**
     * Randomize partition keys based from number of shards
     * @param integer shardsCount the number of shards
     */
    function getPartitionKey(shardsCount) {
        var resources = [],
            partitionkey;

        for (var i = 0; i < shardsCount; i++) {
            resources.push('partition-key-' + i);
        }

        partitionkey = resources[Math.floor(Math.random() * resources.length)];
        return partitionkey;
    }


    function waitForStreamToBecomeActive(kinesis, callback) {
        kinesis.describeStream({ StreamName: config.streamName }, function (err, data) {
            if (!err) {
                if (data.StreamDescription.StreamStatus === 'ACTIVE') {
                    console.log('Current status of the stream is ACTIVE.');
                    callback(null);
                }
                else {
                    console.log('Current status of the stream is ' + data.StreamDescription.StreamStatus);
                    setTimeout(function () {
                        waitForStreamToBecomeActive(callback);
                    }, 1000 * config.waitBetweenDescribeCallsInSeconds);
                }
            }
        });
    }

    /**
     * Create a stream if there's none else use it
     * @param object kinesis the kinesis object
     * @param mixed callback 
     */
    function createStream(kinesis, callback) {
        var params = {
            ShardCount: config.shards,
            StreamName: config.streamName
        };

        kinesis.createStream(params, function (err, data) {
            if (err) {
                // ResourceInUseException is returned when the stream is already created.
                if (err.code !== 'ResourceInUseException') {
                    callback(err);
                    return;
                }
                else {
                    console.log(params.StreamName + ' stream is already created! Re-using it.');
                }
            }
            else {
                console.log(params.StreamName + ' stream does not exist. Created a new stream with that name.');
            }

            // Poll to make sure stream is in ACTIVE state before start pushing data.
            waitForStreamToBecomeActive(kinesis, callback);
        });
    }



    return {
        get: get,
        saveRecord: saveRecord,
        createStream: createStream
    };

} (CONFIG));

module.exports = AWS_KINESIS;



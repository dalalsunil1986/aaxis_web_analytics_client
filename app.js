var AWS = require('aws-sdk');
var AAXIS_TAG_MANAGER = require('./lib/aaxis_tag_manager');
var AWS_KINESIS = require('./lib/aws_kinesis');


var dataLayer = [{pageTitle: "awesome"}, {pageRef: "localhost"}];
//initialize dataLayer for tag manager
AAXIS_TAG_MANAGER.setDataLayer(dataLayer);

//initialize and get kinesis
var kinesis = AWS_KINESIS.get(AWS);

//listen to data changes on dataLayer
AAXIS_TAG_MANAGER.onDataChanged(function (newItem, records) {
  AWS_KINESIS.createStream(kinesis, function (err) {
    if (err) {
      console.log('Error creating stream: ' + err);
      return;
    }
    var record = {
      Data: JSON.stringify(newItem)
    };
    AWS_KINESIS.saveRecord(kinesis, record);
  });  
});


//just for testing when running on Node
dataLayer.push("awesome");
dataLayer.push({click: 56});

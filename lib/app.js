
var AAXIS_TAG_MANAGER = require('../lib/aaxis_tag_manager');
var AWS_KINESIS = require('../lib/aws_kinesis');

if (!dataLayer) {
  dataLayer = [];
}

//initialize dataLayer for tag manager
AAXIS_TAG_MANAGER.setDataLayer(dataLayer);

//initialize and get kinesis
var kinesis = AWS_KINESIS.get(AWS);

//listen to data changes on dataLayer
AAXIS_TAG_MANAGER.onDataChanged(function (newItem, records) {
  var record = {
    Data: JSON.stringify(newItem)
  };
  AWS_KINESIS.saveRecord(kinesis, record);
});





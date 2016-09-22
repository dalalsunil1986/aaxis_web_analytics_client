var AWS_KINESIS = require('../aws_kinesis');

describe('module: AWS_KINESIS', function () {
    var kinesis = null;

    describe("Testing get function", function () {
        kinesis = AWS_KINESIS.get(AWS);
        it("Should return the kinesis object.", function () {
            expect(kinesis).not.toEqual(null);
        });
    });

    describe("Testing saveRecord function", function () {
        var global_options,
            data = { test: "hello from unit test" },
            record = {
                Data: JSON.stringify(data)
            };

        beforeEach(function () {
            kinesis = AWS_KINESIS.get(AWS);

            spyOn(kinesis, "putRecord").and.callFake(function (options, callback) {
                global_options = options;
            });

        });

        afterEach(function () {
            kinesis = null;
        });

        it("Should call the kinesis putRecord function.", function () {
            AWS_KINESIS.saveRecord(kinesis, record);
            expect(kinesis.putRecord).toHaveBeenCalled();
        });


        it("Should contain valid request parameters to submit.", function () {
            AWS_KINESIS.saveRecord(kinesis, record);
            //verify if we have all the necessary parameters for putRecords to write on the stream           
            expect(global_options.Data).toBeTruthy();
            expect(global_options.PartitionKey).toBeTruthy();
            expect(global_options.StreamName).toBeTruthy();
        });


    });
});
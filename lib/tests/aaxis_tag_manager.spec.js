var AAXIS_TAG_MANAGER = require('../aaxis_tag_manager');

describe('module: AAXIS_TAG_MANAGER', function () {
    
    describe("Testing getDataLayer function", function () {
        var dataLayer = [];

        beforeEach(function () {
            dataLayer.push('hello world');
            dataLayer.push({ event: "Page Load" });
        });

        afterEach(function () {
            dataLayer = [];
        });

        it("Should return undefined w/o calling setDataLayer.", function () {
            var data = AAXIS_TAG_MANAGER.getDataLayer();
            expect(data).toEqual(undefined);
        });


        it("Should return the same array after calling setDataLayer.", function () {
            AAXIS_TAG_MANAGER.setDataLayer(dataLayer);
            var data = AAXIS_TAG_MANAGER.getDataLayer();
            expect(data.length).toEqual(2);
        });

    });

    describe("Testing setDataLayer function", function () {
        var dataLayer = [];

        beforeEach(function () {
            dataLayer.push('hello world');
            dataLayer.push({ event: "Page Load" });
        });

        afterEach(function () {
            dataLayer = [];
        });

        it("Should set the dataLayer.", function () {
            AAXIS_TAG_MANAGER.setDataLayer(dataLayer);
            var data = AAXIS_TAG_MANAGER.getDataLayer();
            expect(data.length).toEqual(2);
        });
    });

    describe("Testing onDataChanged function", function () {
        var dataLayer = [];
        beforeEach(function () {
            dataLayer.push('hello world');
            dataLayer.push({ event: "Page Load" });
            AAXIS_TAG_MANAGER.setDataLayer(dataLayer);
        });

        afterEach(function () {
            dataLayer = [];
        });

        it("Should throw an error when pushing new items on the dataLayer if onDataChanged callback is not declared.", function () {
            var addItem = function () {
                dataLayer.push('nuke');
            };
            expect(addItem).toThrow(new Error("You need to call onDataChanged first before adding item on the array."));
        });

        it("Should call the onDataChangedCallBack function.", function () {
            var item,
                callBackFactory = {
                    onDataChangedCallBack: function (value) {
                        item = value;
                    }
                };

            //spy on the callback
            spyOn(callBackFactory, 'onDataChangedCallBack');

            AAXIS_TAG_MANAGER.onDataChanged(callBackFactory.onDataChangedCallBack);
            dataLayer.push('hello');
            //expect that the calback is called
            expect(callBackFactory.onDataChangedCallBack).toHaveBeenCalled();
        });

        it("Should expose the first argument of the callback as the new item being added.", function () {
            var item;
            AAXIS_TAG_MANAGER.onDataChanged(function (newItem) {
                item = newItem;
            });
            dataLayer.push('hello');
            dataLayer.push('test12345');
            //expect that the last item is returned from the callback
            expect(item).toEqual('test12345');
        });

        it("Should expose the second argument of the callback as the original value of the dataLayer.", function () {
            var orig_data;            
            AAXIS_TAG_MANAGER.onDataChanged(function (newItem, oldVal) {
                orig_data = oldVal;
            });            
            dataLayer.push('test12345');
            
            var last_item = orig_data[orig_data.length - 1];
            //verify that the last item is still the same before calling setDatalayer
            expect(last_item.hasOwnProperty('event')).toEqual(true);
        });

    });
});
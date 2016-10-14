/**
 * This js file holds the re-usable classes for Aaxon Library
 *
 * @author Joel Capillo <jcapillo@aaxiscommerce.com>
 * @version 1
 * 
 */

/**
 * Module that interface with AWS Firehose
 */
var AWS_FIREHOSE = (function () {
    "use strict";

    //TODO: make this not to be hard-coded value
    var region = "us-west-2",
        streamName = 'aaxon-stream-oregon2';

    /**
     * Initialized credentials
     * @param object aws the instance of Amazon SDK
     */
    function get(AWS, config) {
        if (!AWS || !config) {
            throw new Error("AWS SDK object and config is required.");
        }
        AWS.config.update({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        });
        AWS.config.region = region;
        return new AWS.Firehose();
    }


    /**
    * Actual function that saves data to the stream
    * @param object firehose the AWS firehose object
    * @param object aaxonTrackingObj the record object to save
    */
    function sendTrackingInfoFirehose(firehose, aaxonTrackingObj) {
        var params = {
            "DeliveryStreamName": streamName,
            "Record": {
                "Data": JSON.stringify(aaxonTrackingObj) + "\n"
            }
        };

        firehose.putRecord(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
            }
            else {
                console.log(data);
            }
        });
    }

    return {
        get: get,
        sendTrackingInfoFirehose: sendTrackingInfoFirehose
    };

} ());


/**
 * The main module for initiating the Tag Manager
 */
var AAXIS_TAG_MANAGER = (function () {

    'use strict';
    var aaxisdataLayer,
        callBack,
        //set callback function to fire when data is being pushed on the dataLayer
        onDataChanged = function (callback) {
            callBack = callback;
        },
        /**
         * Custom event to raise when pushing an item to the array
         * @param mixed item the new item added to the dataLayer
         * @param mixed oldVal the old state of the dataLayer before adding the new item 
         */
        raiseCustomEvent = function (item, oldVal) {
            if (!isFunction(callBack)) {
                throw new Error("You need to call onDataChanged first before adding item on the array.");
            }
            callBack(item, oldVal);
        };

    /**
     * Create an array to be observable
     * @param mixed dataLayer the array to watch for changes
     */
    function makeObservableArray(dataLayer) {
        Object.defineProperty(dataLayer, "push", {
            configurable: false,
            enumerable: false, // hide from for...in
            writable: false,
            value: function () {
                for (var i = 0, n = this.length, l = arguments.length; i < l; i++ , n++) {
                    raiseCustomEvent.apply(null, [arguments[i], this]); // assign/raise custom event         
                }
                return n;
            }
        });
    }

    /**
     * Checks if an object is truly a function
     * @param mixed functionToCheck 
     */
    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    function init(data) {
        makeObservableArray(data);
    }

    function getData() {
        return aaxisdataLayer;
    }

    function setData(dataLayer) {
        if (dataLayer.prop && dataLayer.prop.constructor === Array) {
            aaxisdataLayer = dataLayer;
        }
        else {
            aaxisdataLayer = [dataLayer];
        }
        init(aaxisdataLayer);
    }

    /**
     * Create default info object and return
     * @param mixed dataLayer the datasource object from the page
     * @param string cookieName the name of the cookie to find in the page
     * @return object
     */
    function getHeader(dataLayer, cookieName) {
        if (typeof cookieName === "undefined" || !cookieName) {
            cookieName = 'aaxisCookie';
        }
        var site = null,
            locale = null,
            //get cookie by name
            getCookie = function (name) {
                var re = new RegExp(name + "=([^;]+)");
                var value = re.exec(document.cookie);
                return (value !== null) ? unescape(value[1]) : null;
            },
            guidGenerator = function () {
                var S4 = function () {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                };
                return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
            },
            //get stored cookie else set it
            storedCookie = function (cookieName, expires) {
                if (!getCookie(cookieName)) {
                    var date = new Date();
                    var expiry = new Date();
                    expiry.setTime(date.getTime() + (3600 * 1000 * 24 * 365 * expires)); // Ten minutes
                    // Date()'s toGMTSting() method will format the date correctly for a cookie
                    document.cookie = cookieName + "=" + guidGenerator() + "; expires=" + expiry.toGMTString();
                }
                return getCookie(cookieName);
            };

        if (dataLayer.hasOwnProperty('site')) {
            site = dataLayer.site;
        }

        if (dataLayer.hasOwnProperty('locale')) {
            locale = dataLayer.locale;
        }

        return {
            "pageURL": window.location.href,
            "pageTitle": document.title,
            "userAgent": navigator.userAgent,
            "os": navigator.platform,
            "site": site,
            "locale": locale,
            "recordDate": new Date().toTimeString(),
            "cookie": storedCookie(cookieName, 10),
            "view-screen": window.screen.availWidth + "X" + window.screen.availHeight,
            "geoLocation": ""
        };
    }

    /**
     * Returns the identifier of the page
     * @param string page_path the current page url
     * @param mixed identifiers collection/array of page ids 
     * @return string the page id 
     */
    function getPageId(page_path, identifiers) {
        var i,
            len = identifiers.length,
            page,
            page_id;

        for (i = 0; i < len; i++) {
            page = identifiers[i];
            if (page && page_path.toLowerCase().indexOf(page.toLowerCase()) !== -1) {
                page_id = page.toUpperCase();
                break;
            }
        }

        return page_id;
    }


    /**
     * An overridable function that adds the custom data for tracking
     * @param string page_id the id of the page to track
     * @param mixed aaxonTrackingObj the object to add data and submit for tracking
     * @param mixed datalayerObj the object to from the client 
     * @return mixed aaxonTrackingObj 
     */
    function addPageLoadData(page_id, aaxonTrackingObj, dataLayerObj) {
        return aaxonTrackingObj;
    }

    /**
     * Returns the events object before the user unloads or closes the browser
     * @param integer time_spent time
     * @param object datalayerObj the object to modify and submit to the stream
     */
    function getPageUnloadEvent(time_spent, dataLayerObj) {
        extractDataFromDL.setDataLayer(dataLayerObj);
        return extractDataFromDL.getPageUnloadEvents(time_spent);
    }


    return {
        getDataLayer: getData,
        setDataLayer: setData,
        getHeader: getHeader,
        getPageId: getPageId,
        onDataChanged: onDataChanged,
        addPageLoadData: addPageLoadData,
        getPageUnloadEvent: getPageUnloadEvent,
    };

} ());

/**
 * TODO: Need Rhagu to document the functionalities
 */
var extractDataFromDL = (function () {
    "use strict";

    var datalayer = {},
        setDataLayer = function (dataLayerObj) {
            datalayer = dataLayerObj;
        },
        getProfileId = function () {
            if (datalayer.profile !== undefined && datalayer.profile.dataSource !== undefined) {
                return datalayer.profile.dataSource.id;
            }
            return null;
        },
        getProductsViewed = function () {
            var products = [];
            if (datalayer.productViewed) {
                if (Array.isArray(datalayer.productViewed)) {
                    for (var i = 0; i < datalayer.productViewed.length; i++) {
                        products.push({
                            id: datalayer.productViewed[i].id,
                            qty: "",
                            name: datalayer.productViewed[i].displayName,
                            price: datalayer.productViewed[i].price
                        });
                    }
                } else {
                    products.push({
                        id: datalayer.productViewed.id,
                        qty: "",
                        name: datalayer.productViewed.displayName,
                        price: datalayer.productViewed.price
                    });
                }
            }
            return products;
        },
        getProductsFromOrder = function () {
            var productsFromOrder = [];
            if (datalayer.order) {
                if (Array.isArray(datalayer.order.commerceItems)) {
                    for (var i = 0; i < datalayer.order.commerceItems.length; i++) {
                        productsFromOrder.push({
                            id: datalayer.order.commerceItems[i].productId,
                            qty: datalayer.order.commerceItems[i].quantity,
                            name: datalayer.order.commerceItems[i].productDisplayName,
                            price: datalayer.order.commerceItems[i].priceInfo.amount
                        });
                    }
                }
            }
            return productsFromOrder;
        },
        getPriceInfo = function () {
            if (datalayer.order && datalayer.order.hasOwnProperty('priceInfo') && datalayer.order.priceInfo) {
                return datalayer.order.priceInfo;
            }
            return null;
        },
        getOrderInfo = function () {
            var order = {},
                priceInfo = getPriceInfo();
            order = {
                orderId: datalayer.order.id
            };

            order.amount = (priceInfo) ? priceInfo.total : null;
            order.shipping = (priceInfo) ? priceInfo.shipping : null;
            order.tax = (priceInfo) ? priceInfo.tax : null;
            order.discount = (priceInfo) ? priceInfo.discountAmount : null;

            return order;
        },
        getUpdateItem = function () {
            var evts = [];
            evts.push(
                {
                    id: "",
                    qty: "",
                    name: "",
                    price: ""
                }
            );
            return evts;
        },
        getRemovedItem = function () {
            var evts = [];
            evts.push(
                {
                    id: "",
                    qty: "",
                    name: "",
                    price: ""
                }
            );
            return evts;
        },
        getPageUnloadEvents = function (timeSpent) {
            var evts = [];
            evts.push(
                {
                    eventName: "pageUnload",
                    eventType: "view",
                    eventDate: new Date().toTimeString(),
                    eventlocation: window.location.href,
                    timeSpent: timeSpent
                }
            );
            return evts;
        },
        getHomePageEvents = function () {
            var evts = [];
            evts.push(
                {
                    eventName: "page",
                    eventType: "view",
                    eventDate: new Date().toTimeString()
                }
            );
            return evts;
        },
        getCartEvents = function () {
            var evts = [];
            evts.push({
                eventName: "cart",
                eventType: "checkout",
                eventDate: new Date().toTimeString(),
                products: getProductsFromOrder()
            });
            return evts;
        },
        getThankYouEvents = function () {
            var evts = [];

            evts.push({
                eventName: "thankYou",
                eventType: "checkout",
                eventDate: new Date().toTimeString(),
                products: getProductsFromOrder(),
                order: getOrderInfo()
            });
            return evts;
        },
        getProductViewEvents = function () {
            var evts = [];
            evts.push({
                eventName: "pdp",
                eventType: "view",
                eventDate: new Date().toTimeString(),
                products: getProductsViewed(),
            });
            return evts;
        },
        getSearchProdViewEvents = function () {
            var evts = [];
            evts.push({
                eventName: "search",
                eventType: "view",
                eventDate: new Date().toTimeString(),
                products: getProductsViewed(),
            });
            return evts;
        };


    return {
        getProfileId: getProfileId,
        getProductsFromOrder: getProductsFromOrder,
        getProductsViewed: getProductsViewed,
        getOrderInfo: getOrderInfo,
        getUpdateItem: getUpdateItem,
        getRemovedItem: getRemovedItem,
        getPageUnloadEvents: getPageUnloadEvents,
        getHomePageEvents: getHomePageEvents,
        getThankYouEvents: getThankYouEvents,
        getProductViewEvents: getProductViewEvents,
        getSearchProdViewEvents: getSearchProdViewEvents,
        getCartEvents: getCartEvents,
        setDataLayer: setDataLayer
    };

} ());


/**
 * Initialize tag Manager
 * @param mixed dataLayerObj the object that carries data for firehose stream submisssion
 * @param object config the object that holds security credentials
 * @param mixed AWS the AWS sdk library 
 */
var initAaxonPageTracker = function (dataLayerObj, config, AWS) {
    "use strict";

    var firehose = AWS_FIREHOSE.get(AWS, config);

    AAXIS_TAG_MANAGER.setDataLayer(dataLayerObj);

    //start listening
    AAXIS_TAG_MANAGER.onDataChanged(function (newItem, records) {
        console.log(newItem);
        console.log('submitting to fireHose');
        AWS_FIREHOSE.sendTrackingInfoFirehose(firehose, newItem);
    });

};




//Contains function to be overridden by clients
//Currently this functions are specifically tailored to the Toshiba site
var AAXON_TAG_INTERFACE = {
    getProductData: function (event) {
        "use strict";
        var priceBox = $(event.target).closest('.se-priceBox');           
        if (priceBox) {
            var price = {},
                price_link = priceBox.find('.totalPrice a');

            price.price = price_link.find('span.price').html();
            price.id = price_link.find('span.price').attr('data-sku-id');
            price.name = price_link.attr('href');
            price.qty = ''; //TODO: assign value for quantity            

            if (price.price && price.id && price.name) {
                //clean-up
                price.price = price.price.trim();
                price.id = price.id.trim();
                price.name = price.name.trim();
                return [{
                    eventType: "Checkout",
                    eventName: "AddToCart",
                    data: [price]
                }];
            }
        }

        return false;
    },
    addPageLoadData: function addPageLoadData(pages_to_track, aaxonTrackingObj, dataLayerObj) {
        "use strict";
        var page_id = AAXIS_TAG_MANAGER.getPageId(window.location.href, pages_to_track),
            //to be set for other unidentified pages
            event = {
                "eventName": "Unknown",
                "eventType": "View",
                "eventView": "Page Load"
            };

        //set the datalayerObj to be available on extractDataFromDL module
        extractDataFromDL.setDataLayer(dataLayerObj);

        //switch between pages
        switch (page_id) {
            case "HOME":
                event = extractDataFromDL.getHomePageEvents();
                break;
            case "SHOPPINGCART":
                event = extractDataFromDL.getCartEvents();
                break;
            case "THANK":
                event = extractDataFromDL.getThankYouEvents();
                break;
            case "SEARCH":
                event = extractDataFromDL.getSearchProdViewEvents();
                break;
            default:
                if (dataLayerObj.hasOwnProperty('productViewed') && dataLayerObj.productViewed) {
                    event = extractDataFromDL.getProductViewEvents();
                }
        }

        aaxonTrackingObj.events = event;
        return aaxonTrackingObj;
    },
    getPageUnloadEvent: AAXIS_TAG_MANAGER.getPageUnloadEvent
};











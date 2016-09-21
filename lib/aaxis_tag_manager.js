
/**
 * The main module for initiating the Tag Manager
 */
var AAXIS_TAG_MANAGER = (function () {
  'use strict';
  var aaxisDataLayer,
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

  function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
  }

  function init(data) {
    makeObservableArray(data);
  }

  function getData() {
    return aaxisDataLayer;
  }

  function setData(dataLayer) {
    aaxisDataLayer = dataLayer;
    init(aaxisDataLayer);
  }


  return {
    getDataLayer: getData,
    setDataLayer: setData,
    onDataChanged: onDataChanged
  };

} ());

module.exports = AAXIS_TAG_MANAGER;











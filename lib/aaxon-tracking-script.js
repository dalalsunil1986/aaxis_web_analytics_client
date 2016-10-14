/**
 * This js file holds the script that initiates Aaxon Library to the customer side 
 * Also this package the AWS SDK and Aaxon Library
 *
 * @author Joel Capillo <jcapillo@aaxiscommerce.com>
 * @version 1
 *
 * @example 
 *  //write before the end body tag or GTM DOM ready tag
 *  AaxonTracking(function(){
 *      //clients put their custom code here
 *      
 *      $(document).ready(function(){
 *         //code that needd to fire on doc ready
 *      });
 *  });
 */


function appendJsScript(callback, url) {
    "use strict";
    if (typeof url === "undefined") {
        url = (document.location.protocol == "https:" ? "https://" : "http://") + "sdk.amazonaws.com/js/aws-sdk-2.6.4.min.js";
    }
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    if (script.readyState) {  //IE
        script.onreadystatechange = function () {
            if (script.readyState == "loaded" ||
                script.readyState == "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function () {
            callback();
        };
    }
    script.src = url;
    document.getElementsByTagName('script')[0].parentNode.insertBefore(script, document.getElementsByTagName('script')[0]);
}

/*
* Function that will be called by the client to append script
* @param function the callback function to fire once the script are all loaded
* @return null
*/
function AaxonTracking(callback) {
    if (typeof aaxon_datalayer === "undefined" || !aaxon_datalayer) {
        aaxon_datalayer = {};
    }
    appendJsScript(function () {
        appendJsScript(function () {
            var config = {};
            config.accessKeyId = '';
            config.secretAccessKey = '';
            initAaxonPageTracker(aaxon_datalayer, config, AWS);
            callback();
        }, "/lib/aaxon-lib.js");
    });
}
# Aaxis Page Analytic Client Library

A web analytics Javascipt client library using AWS kinesis stream designed to be used with Google Tag Manager (GTM).

### Prerequisite
Before you begin, Node.js and NPM must be installed on your system. For download instructions for your platform, see http://nodejs.org/download/.

## Creating A Build

Get all required NPM modules. **From the root of the repository**, execute the following command on your terminal:

`npm install`

This downloads all dependencies.

Inside the config folder (create one if there's none), add a js file and name it "config.js". Paste the code below and provide the details of your AWS Kinesis account:

```
    var config = {
        accessKeyId: "",
        secretAccessKey: "",
        region: '',
        streamName: '',
        shards: 4,
        waitBetweenDescribeCallsInSeconds: 5
    };

    module.exports = config;

```

Create the "build.js" file to be used with Google Tag Manager. Perform the command below from the root of the repo.

```sh
    webpack
```

After the command finished, you should see a javascript file named "build.js". This is the file to be used for GTM.

## GTM Implementation Example

Create an account with Google Tag Manager.


Install GTM code on the page. Refer for installation here, https://support.google.com/tagmanager/answer/6103696?hl=en


Create a "Custom HTML" with triggers on "All Elements" and "DOM Ready"


Paste the code below to GTM editor and publish.


```html
 <script src="https://sdk.amazonaws.com/js/aws-sdk-2.0.11.min.js"></script>
 <script>  
 
 //build.js code should be pasted here
   !function(e){function t(n){if(r[n])return r[n].exports;var a= 
   ... more code 
 //end of build.js content

 //add some page load data  
   var referrer = {{Referrer}},
      page_url = {{Page URL}},
      page_path = {{Page Path}},
      page_host_name = {{Page Hostname}};
  
  dataLayer.push({'Referrer': referrer});
  dataLayer.push({'PageUrl': page_url});
  dataLayer.push({'PagePath': page_path});
  dataLayer.push({'PageHostName': page_host_name});
 </script>
``` 



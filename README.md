# Load Impact Chrome Extension

This Chrome Extension mkaes it very easy to record a browser session and reuse it in a load test on the Load Impact 
platform for running and managing performance tests in the cloud.

## Build

To build the extension we use [Grunt](http://gruntjs.com/).

Install dependencies:
    npm install

Build extension:
    grunt build

"build" is the default task, so it's perfectly fine to omit it. The ouput will be a zip-file in the "package/" 
directory. This zip-file is what is uploaded to the Chrome Web Store.


## Developing

When developing an extension the fastest and easiest way of getting a build into Chrome is installing an 
"unpacked extension". To accomplish this follow these simple steps:

1. Build the extension in development-mode using "grunt dev"
2. Open Chrome and browse to chrome://extensions
3. Press "Load unpacked extension"
4. Browse to the repo root and select the "dev/" directory

That's it!

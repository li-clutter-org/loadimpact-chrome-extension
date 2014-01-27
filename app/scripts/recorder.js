/*
 * Copyright 2014 Load Impact
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// Extension namespace.
window.LI = window.LI || {};

(function(LI) {
    LI.Recorder = function() {
        this.recordingTab = null;
        this.recording = false;
        this.requests = {};
        this.startTime = 0;
        this.endTime = 0;
        this.onBeforeRequestCb = $.proxy(this._onBeforeRequest, this);
        this.onBeforeSendHeadersCb = $.proxy(this._onBeforeSendHeaders, this);
        this.onResponseStartedCb = $.proxy(this._onResponseStarted, this);
        this.onCompleteCb = $.proxy(this._onComplete, this);
    };

    LI.Recorder.prototype.getTransactions = function() {
        var transactions = [],
            request = null,
            method = null,
            body = null;
        for (var reqId in this.requests) {
            request = this.requests[reqId];
            method = request.method.toUpperCase();
            body = null;

            if (-1 !== $.inArray(method, ['POST', 'PUT'])) {
                if (request.requestBody.formData) {
                    body = request.requestBody.formData;
                } else {
                    body = request.requestBody.raw;
                }
            }

            transactions.push({
                'timeStamp': request.timeStamp,
                'method': method,
                'url': request.url,
                'requestHeaders': request.requestHeaders,
                'requestBody': body,
                'responseStatusCode': request.responseStatusCode,
                'responseHeaders': request.responseHeaders
            });
        }
        return transactions;
    };

    LI.Recorder.prototype.getStartTime = function() {
        return this.startTime;
    };

    LI.Recorder.prototype.getEndTime = function() {
        return this.endTime;
    };

    LI.Recorder.prototype.pause = function(tabId) {
        chrome.webRequest.onBeforeRequest.removeListener(
            this.onBeforeRequestCb);
        chrome.webRequest.onBeforeSendHeaders.removeListener(
            this.onBeforeSendHeadersCb);
        chrome.webRequest.onResponseStarted.removeListener(
            this.onResponseStartedCb);
        chrome.webRequest.onCompleted.removeListener(
            this.onCompleteCb);
        LI.getIconInstance().setNotRecordingIcon(tabId);
        this.recording = false;
    };

    LI.Recorder.prototype.reset = function() {
        this.requests = {};
        this.startTime = 0;
        this.endTime = 0;
    };

    LI.Recorder.prototype.start = function(tabId, urlIncludePatterns) {
        var urls = urlIncludePatterns.split(','),
            cleanedUrls = [];
        urls.forEach(function(url) {
            cleanedUrls.push(url.replace(/^\s+|\s+$/g, ''));
        });

        var requestFilter = {
            tabId: tabId,
            urls: cleanedUrls
        };

        chrome.webRequest.onBeforeRequest.addListener(
            this.onBeforeRequestCb, requestFilter, ['requestBody']);
        chrome.webRequest.onBeforeSendHeaders.addListener(
            this.onBeforeSendHeadersCb, requestFilter, ['requestHeaders']);
        chrome.webRequest.onResponseStarted.addListener(
            this.onResponseStartedCb, requestFilter, ['responseHeaders']);
        chrome.webRequest.onCompleted.addListener(
            this.onCompleteCb, requestFilter, ['responseHeaders']);
        this.recordingTab = tabId;
        this.recording = true;
        this.startTime = (new Date()).getTime();
        LI.getIconInstance().setRecordingIcon(tabId);
    };

    LI.Recorder.prototype.stop = function(tabId) {
        this.pause(tabId);
        this.recordingTab = null;
        this.endTime = (new Date()).getTime();
    };

    LI.Recorder.prototype._onBeforeRequest = function(details) {
        if (this.requests[details.requestId]) {
            this.requests[details.requestId].redirected = true;
        } else {
            this.requests[details.requestId] = details;
        }
    };

    LI.Recorder.prototype._onBeforeSendHeaders = function(details) {
        if (this.requests[details.requestId] && !this.requests[details.requestId].redirected) {
            this.requests[details.requestId].requestHeaders = details.requestHeaders;
        }
    };

    LI.Recorder.prototype._onResponseStarted = function(details) {
        if (this.requests[details.requestId] && !this.requests[details.requestId].redirected) {
            this.requests[details.requestId].responseStatusCode = details.statusCode;
            this.requests[details.requestId].responseHeaders = details.responseHeaders;
        }
    };

    LI.Recorder.prototype._onComplete = function(details) {
        if (this.requests[details.requestId] && !this.requests[details.requestId].redirected) {
            this.requests[details.requestId].responseStatusCode = details.statusCode;
            this.requests[details.requestId].responseHeaders = details.responseHeaders;
        }
    };
})(LI);

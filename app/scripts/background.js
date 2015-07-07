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

require('app/lib/jquery/jquery');
require('app/scripts/icon');
require('app/scripts/recorder');
require('app/scripts/load_script_generator');

'use strict';

// Extension namespace.
window.LI = window.LI || {};

LI._lastRecordedScript = '';
LI._recorder = null;

LI.getLastRecordedScript = function() {
    return this._lastRecordedScript;
};

LI.getRecorderInstance = function() {
    if (!this._recorder) {
        this._recorder = new LI.Recorder();
    }
    return this._recorder;
};

LI.setLastRecordedScript = function(loadScript) {
    this._lastRecordedScript = loadScript;
};

/**
 * @desc - Handles requests sent by the popup script.
 *
 * @param {object} request - Defined by the calling method.
 *                           Should have the keys 'type' and 'tabId'.
 */
function onRequest(request, sender, sendResponse) {
    var tabId = request.tabId,
        recorder = LI.getRecorderInstance();

    if ('start-recording' === request.type) {
        if (request.clearCache) {
            var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7,
                oneWeekAgo = (new Date()).getTime() - millisecondsPerWeek;
            chrome.browsingData.removeCache({
                'since': oneWeekAgo,
                'originTypes': {
                    'unprotectedWeb': true
                }
            }, function() {
                recorder.start(tabId, request.urlIncludePatterns);
            });
        } else {
            recorder.start(tabId, request.urlIncludePatterns);
        }
    } else if ('stop-recording' === request.type) {
        recorder.stop(tabId);

        // Generate user scenario load script from collected requests and send
        // it to submission page.
        var generator = new LI.LoadScriptGenerator();
        var loadScript = generator.generateFromTransactions(
            recorder.getTransactions(), recorder.getStartTime(),
            recorder.getEndTime());
        LI.setLastRecordedScript(loadScript);

        chrome.tabs.create({'url': 'editor.html', 'active': true, 'openerTabId': tabId}, function(tab) {});

        /**
         * Empty the recorder so a new one can be started without the
         * current content.
         */
        recorder.reset();
    } else if ('pause-recording' === request.type) {
        recorder.pause(request.tabId);
    } else if ('reset-recording' === request.type) {
        recorder.reset();
    } else if ('pause-recording' === request.type) {
        recorder.pause(request.tabId);
    } else if ('get-last-recorded-script' === request.type) {
        sendResponse({
            loadScript: LI.getLastRecordedScript(),
        });
        return;
    } else if ('get-recording-status' === request.type) {
        sendResponse({
            recordingTab: recorder.recordingTab,
            recording: recorder.recording,
        });
        return;
    }

    // Return nothing to let the connection be cleaned up.
    sendResponse({});
}

/**
 * @desc - Handles tab close events.
 *
 * @param {integer} tabId - The ID of the tab being closed.
 * @param {object} removeInfo - Information about reason for tab closure.
 */
function onTabClose(tabId, removeInfo) {
    var recorder = LI.getRecorderInstance();
    if (recorder.recording && recorder.recordingTab == tabId) {
        recorder.stop(tabId);
    }
}

// Listen for the content script to send a message to the background page.
chrome.extension.onRequest.addListener(onRequest);

// Listen for tab close events.
chrome.tabs.onRemoved.addListener(onTabClose);

// Listen for installation events.
chrome.runtime.onInstalled.addListener(function (details) {
    console.log('previousVersion', details.previousVersion);
});

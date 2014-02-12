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
    var ICON_RECORDING_BLINK_INTERVAL = 500;

    LI.getIconInstance = function() {
        if (!this._icon) {
            this._icon = new LI.Icon();
        }
        return this._icon;
    };

    LI.Icon = function() {
        this.iconImg = chrome.runtime.getManifest().browser_action.default_icon['19'];
        this.recordingTab = null;
        this.recordingTimer = null;
    };

    LI.Icon.prototype.setRecordingIcon = function(tabId) {
        this.recordingTab = tabId;

        var self = this,
            icon = {tabId:tabId},
            iconImg = this.iconImg,
            iconSize = 19,
            recordingIconState = true;

        // Create a filled circle to indicate that we are recording.
        function drawCircle(canvas, context) {
            var radius = iconSize/6,
                iconColor = 'red',
                centerX = canvas.width - radius,
                centerY = canvas.height - radius;

            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = iconColor;
            context.lineWidth = 1;
            context.strokeStyle = iconColor;
            context.fill();
            context.stroke();
        }

        function drawIcon(onState) {
            var canvas = document.createElement('canvas'),
                context = canvas.getContext('2d'),
                image = new Image();

            image.src = iconImg;
            canvas.width = canvas.height = iconSize;

            image.onload = function() {
                // No z-index on canvas so draw the icon before the circle.
                context.drawImage(image, 0, 0);
                if (onState) {
                    drawCircle(canvas, context);
                }
                icon.imageData = context.getImageData(0, 0, iconSize, iconSize);
                chrome.browserAction.setIcon(icon);
            };
        }

        function toggleIcon() {
            if (self.recordingTab) {
                drawIcon(recordingIconState);
                recordingIconState = !recordingIconState;
                self.recordingTimer = window.setTimeout(
                    toggleIcon, ICON_RECORDING_BLINK_INTERVAL);
            }
        }

        toggleIcon();
    };

    LI.Icon.prototype.setNotRecordingIcon = function(tabId) {
        this.recordingTab = null;
        window.clearTimeout(this.recordingTimer);

        var icon = {
            tabId: tabId,
            path: this.iconImg,
        };
        chrome.browserAction.setIcon(icon);
    };
})(LI);

// Reset the icon for recording if the tab is refreshed.
chrome.tabs.onUpdated.addListener(function() {
    var icon = LI.getIconInstance();
    if (icon.recordingTab) {
        icon.setRecordingIcon(icon.recordingTab);
    }
});


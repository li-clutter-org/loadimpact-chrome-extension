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

require('app/scripts/application');
require('app/templates/compiled');
require('app/lib/bootstrap/js/alert');
require('app/lib/bootstrap/js/collapse');

'use strict';

LI.Router.map(function() {
    this.route('popup');
});

LI.IndexRoute = Ember.Route.extend({
    beforeModel: function() {
        this.transitionTo('popup');
    }
});

LI.PopupRoute = Ember.Route.extend({
    model: function () {
        return this.get('store').find('options', 1);
    },

    setupController: function(controller, model) {
        controller.set('model', model);
    }
});

LI.PopupController = Ember.ObjectController.extend({
    paused: false,
    recording: false,
    recordingInAnotherTab: false,

    actions: {
        goToAccount: function() {
            chrome.tabs.create({ url: 'https://loadimpact.com/account/api-token' }); 
        },

        pause: function() {
            if (this.get('recording') && !this.get('paused')) {
                this.pause();
                this.set('paused', true);
            }
        },

        reset: function() {
            this.reset();
            this.set('recording', false);
            this.set('paused', false);
        },

        saveToken: function() {
            this.set('apiToken', $('#api-token').val());
            this.get('content').save();
            $('#success').removeClass('hidden');
        },

        toggleRecording: function() {
            if (this.get('recording') && !this.get('paused')) {
                this.stop();
                this.set('recording', false);
                this.set('paused', false);
            } else {
                this.get('content').save();
                this.start();
                this.set('recording', true);
                this.set('paused', false);
            }
        }
    },

    pause: function() {
        chrome.tabs.getSelected(null, function(tab) {
            var msg = {
                'type': 'pause-recording',
                'tabId': tab.id,
            };
            chrome.extension.sendRequest(msg);
        });
    },

    reset: function() {
        chrome.tabs.getSelected(null, function(tab) {
            var msg = {
                'type': 'reset-recording',
                'tabId': tab.id,
            };
            chrome.extension.sendRequest(msg);
        });
    },

    start: function() {
        var self = this;
        chrome.tabs.getSelected(null, function(tab) {
            var urlIncludePatterns = self.get('urlIncludePatterns'),
                clearCache = $('#clear-cache').prop('checked'),
                msg = {
                    'type': 'start-recording',
                    'tabId': tab.id,
                    'urlIncludePatterns': urlIncludePatterns,
                    'clearCache': clearCache
                };
            chrome.extension.sendRequest(msg);
        });
    },

    stop: function() {
        chrome.tabs.getSelected(null, function(tab) {
            var msg = {
                'type': 'stop-recording',
                'tabId': tab.id,
            };
            chrome.extension.sendRequest(msg);
        });
    }
});

LI.PopupView = Ember.View.extend({
    didInsertElement: function() {
        /** Get the recorders state and set the start/stop buttons accordingly. */
        var self = this,
            msg = {
                'type': 'get-recording-status',
            };
        chrome.extension.sendRequest(msg, function(response) {
            if (response.recordingTab) {
                chrome.tabs.getSelected(null, function(tab) {
                    self.get('controller').set('recording', true);
                    if (tab.id === response.recordingTab) {
                        self.get('controller').set('recordingInAnotherTab', false);
                    } else {
                        self.get('controller').set('recordingInAnotherTab', true);
                    }
                });
            } else {
                self.get('controller').set('recording', false);
                self.get('controller').set('paused', false);
            }
        });
    }
});

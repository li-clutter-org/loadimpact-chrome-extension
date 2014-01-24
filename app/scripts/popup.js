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
            chrome.tabs.create({ url: 'https://loadimpact.com/account' }); 
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

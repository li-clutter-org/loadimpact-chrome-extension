require('app/lib/jquery/jquery');
require('app/lib/handlebars/handlebars');
require('app/lib/ember/ember');
require('app/lib/ember-data/ember-data');
require('app/lib/ember-localstorage-adapter/localstorage_adapter');

'use strict';

window.LI = Ember.Application.create({
    LOG_TRANSITIONS: true
});

require('app/scripts/options/model');

LI.LSAdapter = DS.LSAdapter.extend({
    namespace: 'loadimpact-chrome-extension'
});

LI.ApplicationAdapter = LI.LSAdapter;

LI.ApplicationRoute = Ember.Route.extend({
    model: function() {
        var store = this.get('store');
        store.find('options').then(function(options) {
            if (!options.get('content.length')) {
                store.push('options', {
                    id: 1,
                    apiToken: '',
                    apiUrl: 'https://api.loadimpact.com/v2/',
                    urlIncludePatterns: 'http://*/*, https://*/*'
                });
            }
        });
    }
});

LI.ApplicationController = Ember.Controller.extend({
    appName: 'Load Impact User Scenario Recorder'
});

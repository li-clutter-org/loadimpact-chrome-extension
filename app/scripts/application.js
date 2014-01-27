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

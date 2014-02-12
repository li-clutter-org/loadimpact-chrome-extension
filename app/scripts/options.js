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

'use strict';

LI.Router.map(function() {
    this.route('options');
});

LI.IndexRoute = Ember.Route.extend({
    beforeModel: function() {
        this.transitionTo('options');
    }
});

LI.OptionsRoute = Ember.Route.extend({
    model: function () {
        return this.get('store').find('options', 1);
    },

    setupController: function(controller, model) {
        controller.set('model', model);
    }
});

LI.OptionsController = Ember.ObjectController.extend({
    actions: {
        saveOptions: function() {
            this.get('content').save();
            $('#messages > div').remove();
            var msg = $('#success-alert').clone().attr('id', '').removeClass('hidden');
            $('#messages').append(msg).removeClass('hidden');
        }
    },
});

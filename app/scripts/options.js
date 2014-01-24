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

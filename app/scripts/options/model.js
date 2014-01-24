require('app/lib/ember-data/ember-data');

LI.Options = DS.Model.extend({
    apiToken: DS.attr('string'),
    apiUrl: DS.attr('string'),
    urlIncludePatterns: DS.attr('string')
});

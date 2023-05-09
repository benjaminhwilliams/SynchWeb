define(['backbone.paginator', 'utils/kvcollection', 'models/protein'], function(PageableCollection, KVCollection, Protein) {
    
    return PageableCollection.extend(_.extend({
        initialize: function(models, options) {
            this.fetchOnInit = options && options.fetchOnInit;
          },
        
        fetch: function(options) {
        if (this.fetchOnInit === false) {
            this.fetchOnInit = true; // Reset the flag for future fetches
            return;
        }
        // return Backbone.PageableCollection.prototype.fetch.call(this, options);
        },
    }, KVCollection, {
        mode: 'client',
        state: {
            pageSize: 9999,
        },
        model: Protein,
        idAttribute: 'PROTEINID',
        url: '/sample/proteins/distinct',

        keyAttribute: 'ACRONYM',
        valueAttribute: 'PROTEINID',
    }))
})
define([
  'backbone', 
  'underscore', 
  'backbone.paginator', 
  'modules/shipment/models/containercollective', 
  'modules/shipment/collections/distinctproteins', 
  'modules/shipment/collections/containerregistry', 
  'modules/shipment/collections/containerhistory',
  'collections/samples',
  'collections/processingpipelines',
    'collections/users',
], function(Backbone, _, PageableCollection, ContainerCollective, DistinctProteins, ContainerRegistry, ContainerHistory, Samples, ProcessingPipelines, Users) {
    
    return PageableCollection.extend({
        model: ContainerCollective,
        mode: 'server',
        url: '/containercollective',
        initialize: function() {
            this.distinctProteins = new DistinctProteins(null, { fetchOnInit: false });
            this.containerRegistry = new ContainerRegistry();
            this.containerHistory = new ContainerHistory();
            this.samples = new Samples(null, { state: { pageSize: 9999 } });
            this.processing_pipelines = new ProcessingPipelines();
          },
          
        fetchData: function() {
            this.fetch({
              success: (collection, response) => {
                
                collection.distinctProteins.set(response.sample_proteins_distinct);
                collection.containerRegistry.set(response.shipment_container_registry);
                collection.containerHistory.set(response.shipment_container_history);
                collection.samples.set(response.samples);
                collection.processing_pipelines.set(response.process_pipelines);
        
                console.log('Data fetched and collections populated');
              },
              error: () => {
                console.log('Error fetching data');
              },
            });
          },
    })
})
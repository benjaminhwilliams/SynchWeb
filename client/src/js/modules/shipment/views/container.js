define(['marionette',
    'backbone',

    'models/sample',
    'collections/samples',
    'modules/shipment/views/puck',
    'modules/shipment/views/sampletable',

    'modules/shipment/collections/containercollective',

    'modules/shipment/collections/platetypes',
    'modules/shipment/views/plate',

    'collections/users',

    'views/table',

    'utils',
    'formatDate',
    'utils/editable',
    'templates/shipment/container.html'], function(Marionette,
    Backbone,
    Sample,
    Samples,
    PuckView,
    SampleTableView,

    ContainerCollective,

    PlateTypes,
    PlateView,

    Users,

    TableView,

    utils, formatDate,
    Editable, template){

    return Marionette.LayoutView.extend({
        className: 'content',
        template: template,
        samplesCollection: Samples,

        regions: {
            table: '.sample',
            puck: '.puck',
            hist: '.history'
        },

        ui: {
            ext: '.extrainfo',
            auto: '.auto',
            extrastate: '.extra-state',
        },

        events: {
            'click @ui.ext': 'toggleExtra',
            'click a.queue': 'confirmQueueContainer',
            'click a.unqueue': 'confirmUnqueueContainer',
        },

        templateHelpers: function() {
            return {
                IS_STAFF: app.staff,
            }
        },

        toggleExtra: function (e) {
            e.preventDefault()
            this.table.currentView.toggleExtra()
            this.table.currentView.extraState() ? this.ui.extrastate.addClass('fa-minus').removeClass('fa-plus')
                                                : this.ui.extrastate.addClass('fa-plus').removeClass('fa-minus')
        },

        initialize: function(options) {
            var self = this

            this.containercollective = new ContainerCollective()
            this.containercollective.queryParams.shipment_containers_registry_cid = this.model.get('CONTAINERID')
            if (app.options.get('valid_components') && !app.staff) {
                this.containercollective.queryParams.sample_proteins_distinct_external = 1
            }
            this.containercollective.queryParams.shipment_containers_registry_page = 1;
            this.containercollective.queryParams.shipment_containers_registry_per_page = 10;

            this.containercollective.queryParams.shipment_containers_history_cid = this.model.get('CONTAINERID')
            this.containercollective.queryParams.shipment_containers_history_page = 1;
            this.containercollective.queryParams.shipment_containers_history_per_page = 10;

            this.containercollective.queryParams.sample_cid = options.model.get('CONTAINERID')
            this.containercollective.queryParams.sample_sort_by = 'POSITION'
            this.containercollective.queryParams.sample_page = 1
            this.containercollective.queryParams.sample_per_page = 9999

            this.containercollective.queryParams.processing_pipelines_category= 'optional'
            this.containercollective.queryParams.processing_pipelines_status = 'processing'

            this.containercollective.fetch().done(function() {
                // deal with samples
                var samples_total = _.map(_.range(1, parseInt(self.model.get('CAPACITY'))+1), function(e) { return e.toString() })
                var diff = _.difference(samples_total, self.containercollective.samples.pluck('LOCATION'))
                _.each(diff, function(l) {
                    self.containercollective.samples.add(new Sample({ LOCATION: l.toString(), CRYSTALID: -1, PROTEINID: -1, CONTAINERID: options.model.get('CONTAINERID'), new: true }))
                })

                // deal with processing pipelines
                var opts = self.containercollective.processing_pipelines.kv()
                opts[''] = '-'
                self.edit.create('PROCESSINGPIPELINEID', 'select', { data: opts })
            })

            this.samples = this.containercollective.samples;

            this.proteins = this.containercollective.distinctProteins

            this.containerregistry = this.containercollective.containerRegistry

            this.history = this.containercollective.containerHistory;

            this.processing_pipelines = this.containercollective.processing_pipelines;

            // We need users in case we want to edit the container owner
            this.users = new Users(null, { state: { pageSize: 9999 }})
            this.users.queryParams.all = 1
            this.users.queryParams.pid = app.proposal.get('PROPOSALID')

            Backbone.Validation.bind(this)
        },


        onRender: function() {
            var edit = new Editable({ model: this.model, el: this.$el })
            edit.create('NAME', 'text')
            edit.create('COMMENTS', 'text')
            edit.create('EXPERIMENTTYPE', 'select', { data: { '':'-', 'robot':'robot', 'HPLC':'HPLC'} })
            edit.create('STORAGETEMPERATURE', 'select', { data: { '-80':'-80', '4':'4', '25':'25' } })
            edit.create('BARCODE', 'text')
            this.edit = edit

            var self = this
            

            var columns = [
                { name: 'BLTIMESTAMP', label: 'Date', cell: 'string', editable: false },
                { name: 'STATUS', label: 'Status', cell: 'string', editable: false },
                { name: 'LOCATION', label: 'Location', cell: 'string', editable: false },
                { name: 'BEAMLINENAME', label: 'Beamline', cell: 'string', editable: false },
            ]

            this.histtable = new TableView({ collection: this.history, columns: columns, tableClass: 'history', loading: true, pages: true, backgrid: { emptyText: 'No history found', } })
            this.hist.show(this.histtable)

            // Enable editing of the container owner
            // The template restricts this to staff only
            this.users.fetch().done(function() {
                edit.create('OWNERID', 'select', { data: self.users.kv() })
            })

            this.updateAutoCollection()
        },


        updateAutoCollection: function() {
            if (this.model.get('CONTAINERQUEUEID')) {
                this.ui.auto.html('This container was queued for auto collection on '+this.model.escape('QUEUEDTIMESTAMP'))
                this.ui.auto.append(' <a href="#" class="button unqueue"><i class="fa fa-times"></i> Unqueue</a>')
            } else {
                this.ui.auto.html('<a href="#" class="button queue"><i class="fa fa-plus"></i> Queue</a> this container for Auto Collect')
            }
        },

        confirmQueueContainer: function(e) {
            e.preventDefault()
            utils.confirm({
                title: 'Queue Container?',
                content: 'Are you sure you want to queue this container for auto collection?',
                callback: this.doQueueContainer.bind(this)
            })
        },


        doQueueContainer: function(e) {
            var self = this
            Backbone.ajax({
                url: app.apiurl+'/shipment/containers/queue',
                data: {
                    CONTAINERID: this.model.get('CONTAINERID')
                },
                success: function(resp) {
                    app.alert({ message: 'Container Successfully Queued' })
                    self.model.set({
                        CONTAINERQUEUEID: resp.CONTAINERQUEUEID,
                        QUEUEDTIMESTAMP: formatDate.default(new Date(), 'dd-MM-yyyy HH:mm')
                    })
                    self.updateAutoCollection()
                    self.sampletable.toggleAuto(true)
                },
                error: function(resp) {
                    app.alert({ message: 'Something went wrong queuing this container' })
                }
            })
        },

        confirmUnqueueContainer: function(e) {
            e.preventDefault()
            utils.confirm({
                title: 'Unqueue Container?',
                content: 'Are you sure you want to remove this container from the queue? You will loose your current place',
                callback: this.doUnqueueContainer.bind(this)
            })
        },

        doUnqueueContainer: function(e) {
            var self = this
            Backbone.ajax({
                url: app.apiurl+'/shipment/containers/queue',
                data: {
                    CONTAINERID: this.model.get('CONTAINERID'),
                    UNQUEUE: 1,
                },
                success: function(resp) {
                    app.alert({ message: 'Container Successfully Unqueued' })
                    self.model.set('CONTAINERQUEUEID', null)
                    self.updateAutoCollection()
                    self.sampletable.toggleAuto(false)
                },
                error: function(resp) {
                    app.alert({ message: 'Something went wrong unqueuing this container' })
                }
            })
        },


        onShow: function() {
            this._ready.done(this.doOnShow.bind(this))
        },

        doOnShow: function() {
            var self = this
            var noData = _.reduce(this.samples.pluck('HASDATA'), function(a, b) { return a + b ? 1 : 0 }, 0) == 0
            if (this.model.get('CONTAINERSTATUS') != 'processing' && (noData || !this.model.get('CONTAINERREGISTRYID'))) {
                this.containerregistry.fetch().done(function() {
                    var opts = self.containerregistry.kv()
                    opts[''] = '-'
                    self.edit.create('CONTAINERREGISTRYID', 'select', { data: opts })
                })
            }

            var type = this.model.get('CONTAINERTYPE') == 'PCRStrip' ? 'non-xtal' : ''

            if (this.model.get('CONTAINERTYPE') == 'PCRStrip') {
                this.$el.find('.puck').css('width', '50%')
                // this.puck.$el.width(this.puck.$el.parent().width()/2)
                this.platetypes = new PlateTypes()
                this.type = this.platetypes.findWhere({ name: this.model.get('CONTAINERTYPE') })
                this.puck.show(new PlateView({ collection: this.samples, type: this.type }))
            } else this.puck.show(new PuckView({ collection: this.samples, capacity: this.model.get('CAPACITY') }))
            // For editing a plate show all spacegroups - saves needing another control to filter mx faviourites
            this.sampletable = new SampleTableView({ proteins: this.proteins, collection: this.samples, in_use: (this.model.get('CONTAINERSTATUS') === 'processing'), type: type, auto: this.model.get('CONTAINERQUEUEID') ? true : false, allSpacegroups: true  })
            this.table.show(this.sampletable)
        }
    })

})

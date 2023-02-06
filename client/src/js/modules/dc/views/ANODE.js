define([
    'marionette', 'templates/dc/dc_ANODE.html', 'utils', 'utils/xhrimage', 'jquery.mp'
], function(Marionette, template, utils, XHRImage) {
    
    return Marionette.ItemView.extend({
        template: template,
        className: 'clearfix',

        ui: {
            figure: 'figure',
            image: '.map_figure',
            plot: '.plot_ANODE',
            ANODEstats: '.ANODEstats',
            links: '.dplinks'
        },

        showImage: function() {
            this.ui.image.attr('src', this.image.src)
            this.ui.figure.removeClass('pending').addClass('loaded')
        },

        onDomRefresh: function() {

            this.image = new XHRImage()
            this.image.onload = this.showImage.bind(this)
            this.image.load(app.apiurl+ this.model.get('PROCESS').images[1])
    
            if (app.mobile()) {
                this.ui.plot.width(300)
                this.ui.plot.height(300)
                this.ui.ANODEstats.width(300)
            } else {
                this.ui.ANODEstats.width(300)
                this.ui.plot.width(300)
                this.ui.plot.height(300)
            }

            data = []
            for (var i = 0; i < this.model.get('PROCESS').PARAMETERS.MXMRRUNBLOBS.length; i++) {
                data.push([this.model.get('PROCESS').PARAMETERS.MXMRRUNBLOBS[i]["Height"], this.model.get('PROCESS').PARAMETERS.MXMRRUNBLOBS[i]["Site Occupancy Factor"]])
            }

            var data = [{ data: data, label: 'Height vs Site' }]
            var pl = $.extend({},   utils.default_plot, { series: { lines: { show: true }}})
            $.plot(this.ui.plot, data, pl)

            var links = [
                '<a>It works</a>'
            ]
            links = links.slice(1)
            this.ui.links.append(links.join(' '))
        }
    })


})
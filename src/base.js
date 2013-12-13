var utils = require('./utils.js');

/* Draws several lines on a graph, based on some data and some specs. */
module.exports = d3.chart('Base', {
    initialize: function() {
        this.base.style('position', 'relative');

        this.svg = this.base.append('svg')
            .style('pointer-events', 'all');

        var d3Dummy = utils.compose(utils.popThis, d3.select);

        this.layer('svg', this.svg, {
            dataBind: function() {
                var chart = this.chart();
                this.transition()
                   .duration(chart.transitionTime())
                   .attr('width', chart.width())
                   .attr('height', chart.height());
                return this.data([]);
            },
            insert: d3Dummy,
            events: {
                enter: d3Dummy,
            }
        });
    },

    transform: function(data) {
        this.data = data;
        return data;
    },

    redraw: function() {
        this.draw(this.data);
        return this;
    },

    width: utils.property(600),
    height: utils.property(400),
    padding: utils.property([0, 0, 0, 0]),
    transitionTime: utils.property(700),
});

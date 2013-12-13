require('./speclines.js');
var utils = require('./utils.js');

/* Draws several lines on a graph, based on some data and some specs. */
d3.chart('SpecLines').extend('TimeSeries', {
    initialize: function() {
        var brushBase = this.base.append('svg')
            .classed('brush', true);
        this.base.selectAll('svg')
            .style('display', 'block');

        this.scaleX = d3.time.scale();
        this.zeroLine = this.zeroLine.x(utils.compose(utils.get(0), this.scaleX));
        this.line = this.line.x(utils.compose(utils.get(0), this.scaleX));


        this.brush = d3.svutils.brush();

        var onBrush = function() {
            var extent = this.brush.extent();
            this.scaleX.domain(extent);
            this.trigger('update');
            this.brush.event(this.layer('lines'));
        };

        this.brushScale = this.scaleX.copy();
        this.brush.on('brush', onBrush.bind(this));

        this.layer('brush', brushBase, {
            dataBind: function() {
                var chart = this.chart();
                chart.brushScale
                    .domain(chart.scaleX.domain())
                    .range(chart.scaleX.range());
                chart.brush
                    .x(chart.brushScale)
                    .extent(chart.brushScale.domain());

                this.transition().duration(chart.transitionTime())
                    .attr('width', chart.width())
                    .attr('height', 50);

                this.call(chart.brush)
                    .selectAll('rect')
                    .attr('height', 50)
                    .style('stroke', '#f00')
                    .style('fill', '#0f0')
                    .style('fill-opacity', 0.5);

                return d3.selectAll('rect').data([]);
            },
            insert: utils.compose(utils.popThis, d3.select),
            events: {
                enter: utils.compose(utils.popThis, d3.select),
            }
        });

        // var chart = this;
        // this.brush = d3.svutils.brush()
        //     .x(this.brushScale)
        //     .on('brush', function() {
        //         var extent = chart.brush.extent();
        //         console.log('brush!', extent[0].toString(), extent[1].toString());
        //     });

        // this.svutils.append('g')
        //     .attr('transform', utils.format('translate(0,{0})', this.padding()[2]))
        //     .call(this.brush)
        //     .selectAll('rect')
        //         .attr('height', 100)
        //         .style('stroke', '#00f')
        //         .style('fill-opacity', 0.5);
    },

    transform: function(data) {
        data = d3.chart('SpecLines').prototype.transform.call(this, data);
        return data;
    },

    // padding: utils.property([5, 0, 100, 30]),
});

require('./base.js');
var utils = require('./utils.js');

/* A Github Profile style calendar heatmap.
 *
 * Arranged as columns of 7 days (to match a week), with a configurable
 * gap.
 *
 * Configurable Properties:
 * - width: Width of the entire svg. Default 700.
 * - height: Height of the entire svg. Default 100.
 * - cellGap: The spacing between cells. Default 1.
 */
d3.chart('Base').extend('CalendarHeatMap', {
    initialize: function() {

        var hoverBase = this.svg.append('g')
            .classed('hover', true);
        var daysBase = this.svg.append('g')
            .classed('days', true);
        var xAxisBase = this.svg.append('g')
            .classed('x axis', true);
        var yAxisBase = this.svg.append('g')
            .classed('y axis', true);
        var tooltip = this.base.append('div')
            .classed('tooltip', true)
            // These should probably be in a style sheet.
            .style('display', 'none')
            .style('position', 'absolute')
            .style('left', '-10px')
            .style('top', '10px')
            .style('background', 'rgba(240, 240, 240, 0.95)')
            .style('pointer-events', 'none');

        this.numScale = d3.scale.linear();
        this.cellScaleX = d3.scale.linear();
        this.cellScaleY = d3.scale.linear();
        this.colorScale = d3.scale.linear();

        var xIndex = function(d) {
            return Math.floor(this.numScale(d) / 7);
        }.bind(this);

        var yIndex = function(d) {
            return this.numScale(d) % 7;
        }.bind(this);


        var chart = this;
        this.base.select('svg')
            .on('mouseover', function() {
                var daySel = d3.select(d3.event.target);
                var data = d3.event.target.__data__;

                if (daySel.empty() || data === undefined) return;

                var trans = daySel.attr('transform');
                var match = /.*translate\(([\-\d\.]+),([\-\d\.]+)\).*/.exec(trans);
                if (!match) return;

                trans = utils.format('translate({0.1}px,{0.2}px)', match)();

                tooltip
                    .html(chart.tooltipFormat()(data))
                    .style('display', 'block')
                    .style('transform', trans)
                    // Really Chrome?
                    .style('-webkit-transform', trans);
            })
            .on('mouseout', function() {
                var target = d3.event.target;
                if (d3.select(target).filter('rect.pointer-target').empty()) {
                    return;
                }
                tooltip.style('display', 'none');
            });


        this.layer('hover', hoverBase, {
            'dataBind': function() {
                var chart = this.chart();
                this.append('rect')
                    .classed('pointer-target', true)
                    .style('fill', 'none')
                    .style('pointer-events', 'all')
                    .attr('width', chart.width())
                    .attr('height', chart.height());
                return this.data([]);
            },
            insert: utils.compose(utils.popThis, d3.select),
        });

        function daysMerge(selection) {
            var chart = selection.chart();
            return selection
                .attr('fill', utils.compose(chart.heat(), chart.colorScale))
                .attr('width', chart.cellSize)
                .attr('height', chart.cellSize)
                .attr('transform', utils.format('translate({0},{1})',
                    utils.compose(chart.date(), xIndex, chart.cellScaleX),
                    utils.compose(chart.date(), yIndex, chart.cellScaleY)));
        }

        this.days = this.layer('days', daysBase, {
            dataBind: function(data) {
                return this.selectAll('rect').data(data);
            },
            insert: function() {
                var chart = this.chart();
                return this.append('rect')
                    .attr('width', chart.cellSize)
                    .attr('height', chart.cellSize);
            },
            events: {
                enter: function() {
                    this.call(daysMerge);
                },
                'update:transition': function() {
                    var chart = this.chart();
                    this.duration(chart.transitionTime())
                        .call(daysMerge);
                },
                'exit:transition': function() {
                    var chart = this.chart();
                    this.duration(chart.transitionTime() / 2)
                        .attr('width', 0)
                        .attr('opacity', 0.0)
                        .remove();
                }
            }
        });


        function xAxisMerge(selection) {
            var chart = selection.chart();
            return selection
                .text(d3.time.format('%b'))
                .style('font-size', chart.cellSize + 'px')
                .attr('x', utils.add(utils.compose(xIndex, chart.cellScaleX), 1))
                .attr('y', chart.cellSize * 0.8);
        }

        this.layer('xAxis', xAxisBase, {
            dataBind: function(data) {
                var chart = this.chart();

                var dates = d3.extent(data, chart.date());
                var firstMonth = new Date(dates[0].getFullYear(), dates[0].getMonth() + 1, 1);
                var lastMonth = new Date(dates[1].getFullYear(), dates[1].getMonth(), 1);

                var months = [];
                var month = firstMonth;
                while (month <= lastMonth) {
                    months.push(month);
                    month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
                }

                return this
                    .attr('width', chart.width())
                    .attr('height', 20)
                    .selectAll('text')
                        .data(months);
            },
            insert: function() {
                return this.append('text')
                    .classed('x label', true)
                    .style('font-family', 'sans');
            },
            events: {
                'enter': function() {
                    return this.call(xAxisMerge);
                },
                'update:transition': function() {
                    var chart = this.chart();
                    this.duration(chart.transitionTime())
                        .call(xAxisMerge);
                },
            }
        });


        function yAxisMerge(selection) {
            var chart = selection.chart();
            return selection
                .text(utils.ident)
                .attr('x', chart.cellSize / 2)
                .attr('y', utils.compose(utils.add(utils.index, 0.75), chart.cellScaleY))
                .style('font-size', (chart.cellSize * 0.75) + 'px');
        }

        this.layer('yAxis', yAxisBase, {
            dataBind: function() {
                return this.selectAll('text')
                    .data(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
            },
            insert: function() {
                return this.append('text')
                    .classed('y label', true)
                    .style('text-anchor', 'middle')
                    .style('font-family', 'sans');
            },
            events: {
                enter: function() {
                    return this.call(yAxisMerge);
                },
                'update:transition': function() {
                    var chart = this.chart();
                    this.duration(chart.transitionTime())
                        .call(yAxisMerge);
                },
                exit: function() {
                    this.remove();
                }
            }
        });
    },


    transform: function(data) {
        data = d3.chart('Base').prototype.transform.call(this, data);
        var dateExtents = d3.extent(data, this.date());

        // This counts the number of rows that should be on the
        // grid, accounting for the blank days at the start and end,
        // and space for the labels.
        var dayGridWidth = (data.length + dateExtents[0].getDay() + 7 - dateExtents[1].getDay()) / 7 + 1;

        // Figure out the biggest cell that will fit.
        var vertFit = (this.height() - this.cellGap() * 7) / 8;
        var horzFit = this.width() / dayGridWidth - this.cellGap();
        this.cellSize = Math.floor(Math.min(vertFit, horzFit));

        // These scales are smaller than the data. That's fine,
        // d3.scale.linear will extrapolate.
        this.numScale
            .domain([dateExtents[0], +dateExtents[0] + 24 * 60 * 60 * 1000])
            .range([dateExtents[0].getDay(), dateExtents[0].getDay() + 1]);
        // These start from -1 so that there is an extra empty cell
        // to place text in.
        this.cellScaleX
            .domain([-1, 0])
            .range([0, this.cellSize + this.cellGap()]);
        this.cellScaleY
            .domain([-1, 0])
            .range([0, this.cellSize + this.cellGap()]);
        this.colorScale
            .domain(d3.extent(data, this.heat()))
            .range(['rgba(0, 0, 255, 0.1)', 'rgba(0, 0, 255, 1.0)']);

        return data;
    },

    width: utils.property(700),
    height: utils.property(100),
    cellGap: utils.property(1),
    tooltipFormat: utils.property(utils.format('{0.date} - {0.heat}', utils.ident)),
    color: utils.property('#00f'),

    heat: utils.property(utils.get('heat')),
    date: utils.property(utils.get('date')),
});

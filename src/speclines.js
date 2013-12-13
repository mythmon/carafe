require('./base.js');
var utils = require('./utils.js');

/* Draws several lines on a graph, based on some data and some specs. */
d3.chart('Base').extend('SpecLines', {
    initialize: function() {
        var lineBase = this.svg.append('g')
            .classed('lines', true);
        var axesBase = this.svg.append('g')
            .classed('axes', true);

        this.scaleX = d3.scale.linear();
        this.scaleY = d3.scale.linear();

        this.zeroLine = d3.svg.line()
            .x(utils.compose(utils.get(0), this.scaleX))
            .y(this.scaleY.bind(null, 0));

        this.line = d3.svg.line()
            .x(utils.compose(utils.get(0), this.scaleX))
            .y(utils.compose(utils.get(1), this.scaleY));

        this.layer('axes', axesBase, {
            dataBind: function() {
                var chart = this.chart();
                return this.selectAll('g.axis').data([
                    d3.svg.axis()
                        .scale(chart.scaleY)
                        .orient('left')
                        .ticks(4)
                        .tickSize(1),
                    d3.svg.axis()
                        .scale(chart.scaleX)
                        .orient('bottom')
                        .ticks(10)
                        .tickSize(1),
                ]);
            },
            insert: function() {
                return this.append('g')
                    .classed('axis', true);
            },
            events: {
                enter: function() {
                    var chart = this.chart();

                    this.each(function(axis) {
                        var elem = d3.select(this);
                        var tx = 0;
                        var ty = 0;
                        if (axis.orient() === 'left') {
                            tx = 30;
                        } else if (axis.orient() === 'bottom') {
                            ty = chart.height() - 30;
                        }
                        elem.call(axis)
                            .attr('transform', utils.format('translate({0},{1})', tx, ty));
                    });
                },
                'update:transition': function() {
                    var chart = this.chart();

                    this.duration(chart.transitionTime())
                        .each(function(axis) {
                            var elem = d3.select(this);
                            var tx = 0;
                            var ty = 0;
                            if (axis.orient() === 'left') {
                                tx = 30;
                            } else if (axis.orient() === 'bottom') {
                                ty = chart.height() - 30;
                            }
                            elem
                                .attr('transform', utils.format('translate({0},{1})', tx, ty))
                                .call(axis);
                        });
                },
            }
        });

        this.linesLayer = this.layer('lines', lineBase, {
            dataBind: function(data) {
                return this.selectAll('path').data(data);
            },
            insert: function() {
                return this.append('path')
                    .attr('strokeWidth', 2)
                    .attr('fill', 'none');
            },
            events: {
                enter: function() {
                    var chart = this.chart();
                    return this
                        .attr('d', utils.compose(utils.get('points'), chart.zeroLine))
                        .attr('stroke', '#000');
                },
                'enter:transition': function() {
                    var chart = this.chart();
                    return this
                        .delay(function(d, i) { return i * 200; })
                        .duration(chart.transitionTime())
                        .attr('d', utils.compose(utils.get('points'), chart.line))
                        .attr('stroke', utils.get('stroke'));
                },
                'update:transition': function() {
                    var chart = this.chart();
                    return this
                        .duration(chart.transitionTime())
                        .attr('d', utils.compose(utils.get('points'), chart.line))
                        .attr('stroke', utils.get('stroke'));
                },
            },
        });
    },

    width: utils.property(1000),
    height: utils.property(400),
    padding: utils.property([5, 0, 30, 30]),
    specs: utils.property([]),

    /* This is called at the beginning .draw(), and is the last chance
     * to fiddle with the data. It will be called right before any of the
     * layers' dataBind methods, and the return value will be the argument
     * to those functions. */
    transform: function(data) {
        data = d3.chart('Base').prototype.transform.call(this, data);

        var minX = Infinity;
        var maxX = -Infinity;
        var minY = 0;
        var maxY = -Infinity;

        var speccedData = this.specs().map(function(spec) {
            return {
                stroke: spec.stroke || '#000',
                name: spec.name,
                points: data.map(function(d) {
                    var x = spec.x(d);
                    var y = spec.y(d);
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    return [x, y];
                })
            };
        });

        var left = this.padding()[3];
        var right = this.width() - this.padding()[1];
        var top = this.padding()[0];
        var bottom = this.height() - this.padding()[2];

        this.scaleX
            .range([left, right])
            .domain([minX, maxX]);
        this.scaleY
            .range([bottom, top])
            .domain([minY, maxY]);

        return speccedData;
    },

});

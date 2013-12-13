!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.carafe=e():"undefined"!=typeof global?global.carafe=e():"undefined"!=typeof self&&(self.carafe=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./utils.js":6}],2:[function(require,module,exports){
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

},{"./base.js":1,"./utils.js":6}],3:[function(require,module,exports){
var utils = require('./utils.js');
require('./base.js');
require('./calendarheatmap.js');
require('./speclines.js');
require('./timeseries.js');

module.exports = {
  utils: utils,
};

},{"./base.js":1,"./calendarheatmap.js":2,"./speclines.js":4,"./timeseries.js":5,"./utils.js":6}],4:[function(require,module,exports){
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

},{"./base.js":1,"./utils.js":6}],5:[function(require,module,exports){
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

},{"./speclines.js":4,"./utils.js":6}],6:[function(require,module,exports){
// Some helper functions

module.exports = {};

/* Create a function that gets `key` from it's first argument.
 *
 * This will cache functions with the same key. In other words:
 *
 *     var a = get('foo');
 *     var b = get('foo');
 *     a === b;   // True
 */
module.exports.get = (function() {
    var cache = {};

    return function(key) {
        if (!(key in cache)) {
            cache[key] = function(d) {
                return d[key];
            };
        }
        return cache[key];
    };
})();

/* A function that return's it's first argument. */
module.exports.ident = function(d) {
    return d;
};

/* Create a chainable, d3-style property.
 *
 * Use this like:
 *
 *   var foo = {
 *     bar: property(5),
 *   };
 *   foo.bar();  // returns 5
 *   foo.bar(6); // returns foo
 *   foo.bar();  // returns 6
 *
 * :arg def: Default, if no value is set.
 * :arg callback: Function to call when a new value is set.
 */
module.exports.property = function(def, callback) {
    var store = def;
    callback = callback || module.exports.ident;

    return function(newVal) {
        if (arguments.length === 0) {
            return store;
        }
        setTimeout(callback.bind(this, newVal), 0);
        store = newVal;
        return this;
    };
};

/* Create a function that composes each argument passed as a parameter.
 *
 * `compose(a, b)(1)` is equivalent to `b(a(1))`.
 */
module.exports.compose = function(/* funcs */) {
    var funcs = Array.prototype.slice.call(arguments);
    funcs.forEach(function(func, i) {
        if (typeof(func) !== 'function') {
            throw 'Argument #' + i + ' is not a function: ' + func;
        }
    });
    return function(d, i) {
        var res = d;
        funcs.forEach(function(func) {
            res = func(res, i);
        });
        return res;
    };
};

/* Create a function that sums functors.
 *
 * `add(a, b)(1)` is equivalent to `a(1) + b(1)`.
 * `add(a, 2)(1)` is equivalent to `a(1) + 2`.
 */
module.exports.add = function(/* funcs */) {
    var functors = Array.prototype.map.call(arguments, d3.functor);
    return function(d, i) {
        var sum = 0;
        functors.forEach(function(f) {
            sum += f(d, i);
        });
        return sum;
    };
};

/* Create a function that multiplies functors.
 *
 * `multiply(a, b, c)(2)` is equivalent to `a(2) * b(2) * c(2)`.
 * `multiply(a, b, 2)(3)` is equivalent to `a(3) * b(3) * 2`.
 */
module.exports.multiply = function(/* funcs */) {
    var functors = Array.prototype.map.call(arguments, d3.functor);
    return function(d, i) {
        var product = 1;
        functors.forEach(function(f) {
            product *= f(d, i);
        });
        return product;
    };
};

/* Returns its second argument.
 *
 * Intended for use in places where d3 passes the current index as
 * the second argument.
 */
module.exports.index = function(d, i) {
    return i;
};

/* Returns its `this` context.
 *
 * Sometimes a useful thing is passed as `this`, which is unhelpful
 * for functional style. */
module.exports.popThis = function() {
    return this;
};

/* Makes a formatting function.
 *
 * The first argument is a format string, like "hello {0}". The rest
 * of the arguments are functors to fill the slots in the format
 * string.
 *
 * Example:
 *   function ident(n) { return n; }
 *   function double(n) { return n * 2; }
 *   var formatter = module.exports.format('{0} * 2 = {1}', ident, double);
 *   formatter(5);  // returns '5 * 2 = 10'
 */
module.exports.format = function(fmt /*, args */) {
    var args = Array.prototype.slice.call(arguments, 1).map(d3.functor);

    return function(d) {
        return fmt.replace(/\{[\d\w\.]+\}/g, function(key) {
            // Strip off {}
            key = key.slice(1, -1);
            var selectors = key.split('.');

            return module.exports.dottedGet(key, d)(args);
        });
    };
};

/* Like module.exports.get, but allows for dots in keys to get deeper objects. */
module.exports.dottedGet = function(selectors, d) {
    selectors = selectors.split('.');
    return function(obj) {
        for (var i = 0; i < selectors.length; i++) {
            obj = d3.functor(obj[selectors[i]])(d);
            if (obj === undefined) {
                return undefined;
            }
        }
        return obj;
    };
};

},{}]},{},[3])
(3)
});
;
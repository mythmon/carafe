Carafe docs
===========

Project bits
------------

Project metadata:

Name     | Value
-------- | -----------------------------------------
Source:  | https://github.com/mythmon/carafe
Issues:  | https://github.com/mythmon/carafe/issues
License: | BSD 2-clause


Requirements
------------

This requires:

* d3
* d3.chart


    <script type="text/javascript" src="d3.js"></script>
    <script type="text/javascript" src="d3.chart.js"></script>
    <script type="text/javascript" src="carafe.js"></script>


Calendar heat map
-----------------

Draws a calendar heatmap.

data is a list of JavaScript objects with two attributes:

* `date`: JavaScript Date objects
* `heat`: some number indicating the hotness. For example, you could
  range from `0` to `255`.

    var data = [
        {date: new Date(2014, 5, 27), heat: 22},
        {date: new Date(2014, 5, 28), heat: 100},
        {date: new Date(2014, 5, 29), heat: 255},
        {date: new Date(2014, 5, 30), heat: 0},
        {date: new Date(2014, 5, 31), heat: 1}
    ];


CalendarHeatMap arranges that data as columns of 7 days (to match a
week), with a configurable gap.

    var data = [];
    var calendarHeatMap = d3.select('#heatmap')
        .append('svg')
        .chart('CalendarHeatMap')
    calendarHeatMap.draw(data);


You can specify several arguments:

Argument       | Description
-------------- | -----------------------------------------------------
width:         | width of the entire svg. defaults to `700`.
height:        | height of the entire svg. defaults to `100`.
cellGap:       | spacing between teh cells. defaults to `1`.
tooltipFormat: | DOCME 
color:         | the color to range on. defaults to `'#00f'` (blue).
heat:          | function that takes a data point and returns the heat number
date:          | function that takes a data point and returns the date

    var calendarHeatMap = d3.select('#heatmap')
        .append('svg')
        .chart('CalendarHeatMap')
        .height(100)
        .width(700)
        .cellGap(1);
    calendarHeatMap.draw(data);


Spec lines
----------

Draws a graph given an array of objects and a spec object.

Spec objects have at least two properties: `x` and `y`. These are
functions which take an object from the data array and return the x
and y coordinates respectively.

The data is an array of objects that have whatever the spec objects
need to convert to x and y coordinates.

    var data = [
        {height: 0, width: 1},
        {height: 1, width: 2},
        {height: 3, width: 5},
        {height: 8, width: 13},
        {height: 21, width: 34},
        {height: 55, width: 89},
    ];

    var graph = d3.select('#graph')
        .chart('SpecLines')
        .specs([{
            name: "Some Line",
            x: function(d) { return d.height; },
            y: function(d) { return d.width; },
            stroke: '#f00',
        }]);

    graph.draw(data);


You can specify several arguments.

Argument       | Description
-------------- | -----------------------------------------------------
width:         | width of the entire svg. defaults to `1000`.
height:        | height of the entire svg. defaults to `400`.
padding:       | the padding for the graph. defaults to `[5, 0, 30, 30]`.
specs:         | array of objects


Spec objects have the following properties.

Property       | Description
-------------- | -----------------------------------------------------
stroke         | the color to use for making the line
name           | DOCME
x              | function that takes a data item and returns x coord
y              | function that takes a data item and returns y coord

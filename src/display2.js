import * as d3 from 'd3';

export default function display2(data) {
    
    var margin = {top: 20, right: 20, bottom: 70, left: 40},
    width = 2000 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

    // Parse the date / time
    var	parseDate = d3.timeFormat("%Y-%m").parse;

    // var x = d3.scaleOrdinal().rangeRoundBands([0, width], .05);
    var x = d3.scaleBand().range([0, width]);

    var y = d3.scaleLinear().range([height, 0]);

    var xAxis = d3.axisBottom(x)
    .tickFormat(d3.timeFormat("%Y-%m"));

    var yAxis = d3.axisLeft(y)
    .ticks(10);

    var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
        "translate(" + margin.left + "," + margin.top + ")");


    // data.forEach(function(d) {
    //     d.date = parseDate(d.date);
    //     d.value = +d.value;
    // });

    x.domain(data.map(function(d) { return d.week; }));
    y.domain([0, d3.max(data, function(d) { return d.weekCount; })]);

    let mouseG = svg.append("g");
    mouseG
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", "-.55em")
    .attr("transform", "rotate(-90)" );

    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Value ($)");

    ///////////////////////
    // Tooltips
    var overlay = svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)

    var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

    var focus = svg.append("g")
    .attr("class", "focus")
    .style("display", "none");

    focus.append("circle")
    .attr("r", 4.5)

    focus.append("text")
    .attr("x", 9)
    .attr("dy", ".35em");

    svg.selectAll("bar")
    .data(data)
    .enter().append("rect")
    .style("fill", "steelblue")
    .attr("x", function(d) { return x(d.week); })
    .attr("width", x.bandwidth())
    .attr("y", function(d) { return y(d.weekCount); })
    .attr("height", function(d) { return height - y(d.weekCount); })
    .on('mouseover', function(d) {
        // focus.attr("transform", "translate(" + x(formatDate.parse(tar_date)) + ","+y(tar_value)+ ")");
        //focus.attr("transform", "translate(" + x(d.week) + "," + height - y(d.weekCount)+ ")");
        tooltip.html(`${d3.timeFormat("%Y-%b-%e")(d.week)}\n${d.films.map(f => f.title).join(', ')}`)
        .style("visibility", "visible")
        // .style("top", d3.mouse(this)[1] - (tooltip[0][0].clientHeight - 30) + "px")
        // .style("left", d3.mouse(this)[0] - (tooltip[0][0].clientWidth / 2.0) + "px");
        .style("top", d3.mouse(document.querySelector('body'))[1] + "px")
        .style("left", d3.mouse(document.querySelector('body'))[0] + "px");

        d3.select(this).style("fill", "rgb(255,255,0)");
    })
    .on('mouseout', function(d) {
        d3.select(this).style("fill", "steelblue");
    })
}
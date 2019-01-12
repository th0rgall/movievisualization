import 'lodash';
import * as d3 from 'd3';

export default function display(data) {

    // checkout https://bl.ocks.org/cjhin/8872a492d44694ecf5a883642926f19c

    const width = 1000;
    const height = 500;
    var svg = d3.select('body').append('svg')
        .attr("width", width).attr("height", height);

    let xscale = d3.scaleTime()
        .domain(d3.extent(data.map(d=>d.date))) // extent is a quicker form of [data[0].date, data[data.length - 1].date]
        .range([0, width]);

    ///////////////////////
    // Axis
    var xAxis = d3.axisBottom(xscale);
    
    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    console.log(d3.extent(data.map(d=>d.date)));

    //let yscale = d3.linearScale().domain([0, max(data)]).range([0, height]);

    let rects = svg.selectAll('circle').data(data, d => d.title);
    rects.enter().append('circle')
        .attr('cx', d => xscale(d.date))
        .attr('cy', height/2)
        .attr('r', 3)
        .attr('fill', "#000000");

    

}




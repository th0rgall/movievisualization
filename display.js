

d3.json("./movies.json", (data) => {
    data.map(m => {m.date = new Date(m.date); return m});
    display(data);
})

function display(data) {

    const width = 700;
    const height = 500;
    var svg = d3.select('body').append('svg')
        .attr("width", width).attr("height", height);

    let xscale = d3.scaleTime()
        .domain([data[0].date, data[data.length - 1].date])
        .range([0, width]);

    //let yscale = d3.linearScale().domain([0, max(data)]).range([0, height]);

    let rects = svg.selectAll('circle').data(data, d => d.title);
    rects.enter().append('circle')
        .attr('cx', d => xscale(d.date))
        .attr('cy', height/2)
        .attr('r', 3)
        .attr('fill', "#000000");

}


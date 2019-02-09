import * as d3 from 'd3';
const ColorThief = require('color-thief');
const colorThief = new ColorThief();

export default function display2(weeklyData) {

    let toIndividualData = (weeklydata) => {
        return weeklydata.reduce((acc, c, i, arr) => {

            let mapfilm =  (f, fi, fa) => {
                f.weekCount = c.weekCount;
                f.week = c.week;
                f.filmCount = fa.indexOf(f) + 1;
                return f;
            };

            if (c.films && c.films.length > 0) {
                return [].concat(acc, c.films.map(mapfilm));
            } else {
                return acc;
            }
        }, []);
    };

    let individualData = toIndividualData(weeklyData);
    
    const margin = {top: 20, right: 20, bottom: 70 + 100 + 20, left: 40};
    const innerPadding = 0.30;
    const tileWidth = 52;
    const width = (tileWidth * ( 1 + innerPadding)) * weeklyData.length;
    
    // var x = d3.scaleOrdinal().rangeRoundBands([0, width], .05);
    var x = d3.scaleBand().domain(weeklyData.map(function(d) { return d.week; }))
    .range([0, width]).paddingInner(innerPadding);

    const posterRatio = 1.48; // average ratio...
    const tileHeight = tileWidth * posterRatio;
    const verticalPadding = tileWidth * innerPadding; 
    let maxFilmCount = d3.max(individualData.map(f => f.filmCount));
    let height = tileHeight * maxFilmCount + verticalPadding * (maxFilmCount - 1);

   // height = 400 - margin.top - margin.bottom;

    // poster ratio 1.48

    // Parse the date / time
    var	parseDate = d3.timeFormat("%Y-%m").parse;


    //var y = d3.scaleLinear().rangeRound([height, 0]);
    let enumToMax = m => {let a = []; for (let i = 1; i <= m; i++) {a[i-1] = i} return a};
    var y = d3.scaleBand().rangeRound([height, 0]).paddingInner(0.1);

    // yearAxis
    var yearAxis = d3.axisBottom(x);
    yearAxis.tickFormat(d3.timeFormat("%Y"));
    yearAxis.tickValues(x.domain().filter(function(d,i,a) {
        // TODO: maybe some unattended edge cases here
        if (d.getMonth() === 0) {
            // can look back
            if (i > 0) {
                if (a[i-1].getMonth() === 11) {
                    return true;
                }
            }
        }
        return false;
    }));

    // monthAxis
    var monthAxis = d3.axisBottom(x);
    monthAxis.tickFormat(d3.timeFormat("%B"));
    monthAxis.tickValues(x.domain().filter((d,i,a) => {
        if (i > 0) {
            if (a[i-1].getMonth() !== d.getMonth()) {
                return true;
            }
        }
        return false;
    }));
    
    var yAxis = d3.axisLeft(y);
    

    var svg = d3.select("body").append("svg")
    .attr("class", "movie-svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
        "translate(" + margin.left + "," + margin.top + ")");


    // data.forEach(function(d) {
    //     d.date = parseDate(d.date);
    //     d.value = +d.value;
    // });

    //y.domain([0, d3.max(data, function(d) { return d.weekCount; })]);
    y.domain(enumToMax(maxFilmCount))

    let textColor = "#fff";

    let yearTicks = svg.append("g");
    yearTicks
    .attr("class", "x axis axis--year")
    .attr("transform", "translate(0," + height + ")")
    .call(yearAxis)
    .selectAll("text")
    .attr("class", "axis__year-ticks")
    .style("text-anchor", "start")
    .attr("dx", "-60")
    .attr("dy", "100")
    .attr("fill", textColor)
    //.attr("transform", "rotate(-90)" );

    d3.select(".axis--year .domain")
    .attr("transform", `translate(0, ${verticalPadding})`);

    let monthTicks = svg.append("g");
    monthTicks
    .attr("class", "x axis axis--month")
    .attr("transform", "translate(0," + height + ")")
    .call(monthAxis)
    .selectAll("text")
    .attr("class", "axis__month-ticks")
    .style("text-anchor", "start")
    .attr("dx", "-23")
    .attr("dy", "65")
    .attr("fill", textColor)
    //.attr("transform", "rotate(-90)" );

    monthTicks
    .selectAll(".axis--month line")
    .attr("transform", "translate(-23, 10)");

    // svg.append("g")
    // .attr("class", "y axis")
    // .call(yAxis)
    // .append("text")
    // .attr("transform", "rotate(-90)")
    // .attr("y", 6)
    // .attr("dy", ".71em")
    // .style("text-anchor", "end")
    // .attr("fill", textColor)
    // .text("Value ($)");

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
    .attr("dy", ".35em")
    .attr("fill", textColor);

    // DETAILS
    //
    //

    var details = d3.select("body").append("div").attr("class", "details side");
    var detailsTop = details.append("div").attr("class", "details__top");
    detailsTop.append("img").attr("class", "details__img");
    var detailsProps = detailsTop.append("div").attr("class", "details__props");
    detailsProps.append("h2").attr("class", "details__props__title");
    detailsProps.append("p").attr("class", "details__props__facts");
    var detailsBottom = details.append("div").attr("class", "details__bottom");

    // BARS
    //
    //

    let bars = svg.selectAll("bar")
    //.data(data)
    .data(individualData.filter(d => d.filmCount ? true : null))
    .enter();

    const highlightClass = "movieTile--highlighted";

    bars.append(d => d.imgUrl && d.imgUrl.match(/https?/) ? document.createElementNS('http://www.w3.org/2000/svg', "image") 
        : document.createElementNS('http://www.w3.org/2000/svg', "rect"))
    //.style("fill", "steelblue")
    .attr("class", "movieTile")
    .attr("x", function(d) { return x(d.week); })
    .attr("width", x.bandwidth())
    .attr("y", function(d) { return y(d.filmCount); })
    .attr("height", y.bandwidth())
    .attr("xlink:href", function(d) { return d.imgUrl ? d.imgUrl : null})
    .attr("fill", function(d) {return d.imgUrl ? null : "grey"})
    .on('mouseover', function(d) {
        // focus.attr("transform", "translate(" + x(formatDate.parse(tar_date)) + ","+y(tar_value)+ ")");
        //focus.attr("transform", "translate(" + x(d.week) + "," + height - y(d.weekCount)+ ")");
        let ttoffsetx = 0;
        let ttoffsety = -100;
        this.classList.toggle(highlightClass);

        tooltip.html(`${d3.timeFormat("%Y-%b-%e")(d.week)}\n${d.title}`)
        .style("visibility", "visible")
        // .style("top", d3.mouse(this)[1] - (tooltip[0][0].clientHeight - 30) + "px")
        // .style("left", d3.mouse(this)[0] - (tooltip[0][0].clientWidth / 2.0) + "px");

        .style("top", d3.mouse(document.querySelector('body'))[1] + ttoffsety + "px")
        .style("left", d3.mouse(document.querySelector('body'))[0] + ttoffsetx + "px");

        //d3.select(this).style("fill", "rgb(255,255,0)");
    })
    .on('mouseout', function(d) {
        //d3.select(this).style("fill", "steelblue");
        this.classList.toggle(highlightClass);
    })
    .on('click', (d) => {
        d3.select(".details__img").attr("src", d.imgUrl);
        d3.select(".details__props__title").text(d.title);
        
        let colors = null;
        // 
        colors = colorThief.getColor(document.querySelector('.details__img'));
        setTimeout(() => {colors = colorThief.getColor(document.querySelector('.details__img'))
        console.log(colors);
    
        if (colors) {
            d3.select(".details").attr("style", `background: radial-gradient(at 10% 10%, rgb(${colors.join(',')}), #000 90%)`);
        }
    }, 20);
 
    })
}
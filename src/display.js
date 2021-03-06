import * as d3 from 'd3';
import imdbLogo from './imdb_logo.png'; 
import flashIcon from './flash.svg';
import screenfull from 'screenfull';

export default function display(weeklyData) {

    // STATIC CODE
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

    function releaseCount(data) {
        let yearMap = {};
        let out = [];
        data.filter(d => Boolean(d.Year) && /\d{4}/.exec(d.Year))
        // TODO: temp for series
        .map(
            d => {
            let year = /\d{4}/.exec(d.Year);
            return {...d, Year: year[0]};
        })
        .forEach(d => {
            if (!(d.Year in yearMap)) {
                yearMap[d.Year] = 1;
                out.push({...d, releaseCount: 1})
    
            } else {
                let val = yearMap[d.Year];
                yearMap[d.Year] = ++val;
                out.push({...d, releaseCount: val})
            }
        })
        return out;
    }

    function isFavorite(d) {
        return d.Favorite === "checked" || d.Favorite === true || d.Favorite === "true";
    }

    function toggleFavorites(e) {
        if (!favSheet) {
            var sheet = document.createElement('style');
            sheet.id = 'fav-sheet';
            sheet.innerHTML = `.movieTile:not(.favorite) {
                opacity: 0.3;
                filter: drop-shadow(0 6px 9px rgba(0, 0, 0, 0.5)) blur(4px);
                transition: all 0.4s;
            }`;
            document.body.appendChild(sheet);
            favSheet = true;
        } else {
            let sheet = document.getElementById('fav-sheet');
            sheet.parentNode.removeChild(sheet);
            favSheet = false;
        }

        document.getElementById("control-favorites").classList.toggle("active");
    }

    // TODO check is mode dependent
    // used as css ID selector too, so can't have whitespace or other illegal
    let keyFunction = d => `${d.Title.slice(0, 7).replace(/\s+|[\.\/>',:é]/g,"")}-${d.watchedDate ? d.watchedDate.getTime() : ""}`;

    function highlightSelected(d) {
        const selectedClass = "movieTile--selected";
        // dehighlight previous
        selectedNode ? selectedNode.classed(selectedClass, false) : null;
        // highlight next
        selectedNode = d3.select("#" + keyFunction(d));
        selectedNode ? selectedNode.classed("movieTile--selected", true) : null;
    }

    function goToNext() {
        const data = mode.getData();
        /* TODO there is a bug: it doesn't know what the last favorite is
         just stops at the last non-favorite
         skip indexes until next favorite
         solution: skip on a second, seperata variable. 
         Only transfer back to real one if a non-fav end is not reached 
        */
        if (favSheet && selectedIndex && selectedIndex < data.length - 1) {
            ++selectedIndex;
            while (selectedIndex < data.length - 1 && !isFavorite(data[selectedIndex])) {
                selectedIndex++;
        }
        // normal skip
        } else if (selectedIndex < data.length - 1) {
            ++selectedIndex;
        }

        if (selectedIndex) {
            openDetails(data[selectedIndex], selectedIndex);
        }
    }

    function goToPrevious() {
        const data = mode.getData();
        // skip indexes until next favorite
        if (favSheet && selectedIndex && selectedIndex > 0) {
            --selectedIndex;
            while (selectedIndex > 0 && !isFavorite(data[selectedIndex])) {
                selectedIndex--;
        }
        // normal skip
        } else if (selectedIndex > 0) {
            --selectedIndex;
        }

        if (selectedIndex) {
            openDetails(data[selectedIndex], selectedIndex);
        }
    }

    let favSheet = false;
    window.addEventListener("keydown", (e) => {
        switch (e.key.toUpperCase()) {
            case "F":
                toggleFavorites();
                break;
            case "W":
                setWatchedMode();
                break;
            case "R":
                setReleaseMode();
                break;
            case "ESCAPE":
                toggleOverlay();
                break;
            case "ARROWLEFT":
                goToPrevious();
                break;
            case "ARROWRIGHT":
                goToNext();
                break;
        }
        e.stopPropagation();
    });
    
    let selectedIndex = 0;
    let selectedNode = null;

    class ReleaseMode {
        getData() {
            return deduplicatedData;
        }

        getX(d) {
            return xRelease(+d.Year) + innerPaddingXAbsolute/2 + 1;
        }

        getY(d) {
            return yRelease(d.releaseCount);
        }

        getBandwidth() {
            return xRelease.bandwidth();
        }

        getWidth() {
            return releaseWidth;
        }

        getHeight() {
            return releaseHeight;
        }

        // TODO: should have similar extra height logic
        getOuterHeight() {
            return this.getHeight();
        }

        getInitialY() {
            return this.getHeight()/3;
        }

        getBandheight() {
            return yRelease.bandwidth();
        }

        getMonthAxis() {
            return monthAxisRelease;
        }

        getYearAxis() {
            return yearAxisRelease;
        }
    }

    class WatchedMode {
        getData() {
            return individualData;
        }

        getX(d) {
            return x(d.week);
        }

        getY(d) {
            return y(d.filmCount) + extraHeight;
        }
        
        getBandwidth() {
            return x.bandwidth();
        }

        getWidth() {
            return width;
        }

        getHeight() {
            return height;
        }

        getOuterHeight() {
            return height + extraHeight;
        }

        getInitialY() {
            return -tileHeight * 1.5;
        }
        
        getBandheight() {
            return y.bandwidth();
        }

        getMonthAxis() {
            return monthAxis;
        }

        getYearAxis() {
            return yearAxis;
        }
    }

    // viewMode = release | watched
    let mode = new WatchedMode();

    let individualData = 
        toIndividualData(weeklyData)
        .filter(d => d.filmCount ? true : null)
        .sort((a,b) => a.watchedDate - b.watchedDate);

    // release view data
    const titleSorted =
        individualData.slice().sort((a,b) => a.Title.localeCompare(b.Title));

    let deduplicatedData = [];
    for (let i = 0; i < titleSorted.length; i++) {
        if (i == titleSorted.length - 1 || titleSorted[i].Title !== titleSorted[i+1].Title) {
            deduplicatedData.push(titleSorted[i]);
        }
    }

    deduplicatedData = 
        releaseCount(deduplicatedData)
        // sort again by year to allow datewise navigation
        .sort((a,b) => a.Year - b.Year);

    const margin = {top: 20, right: 20, bottom: 70 + 100 + 20, left: 40};
    const innerPaddingX = 0.30;
    const innerPaddingY = 0.15;
    const tileWidth = 52;
    const ext = d3.extent(deduplicatedData.map(d => Number(d.Year)));
    const no = ext[1] - ext[0];
    const innerPaddingXAbsolute = tileWidth * innerPaddingX; 
    const tileWithOneSidePadding = tileWidth * ( 1 + innerPaddingX);
    const releaseWidth =  tileWithOneSidePadding * no - (2 * innerPaddingXAbsolute);
    // todo weeklydata.length might be filtered later on
    const width = (tileWidth * ( 1 + innerPaddingX)) * weeklyData.length;

    // domain for watched view
    var x = d3.scaleBand().domain(weeklyData.map(function(d) { return d.week; }))
        .range([0, width]).paddingInner(innerPaddingX);

    // domain for release view
    var xRelease = d3.scaleBand().domain(d3.range(no+1).map(a => a+ext[0]))
    .range([0, releaseWidth]).paddingInner(innerPaddingX);

    const posterRatio = 1.48; // average ratio...
    const tileHeight = tileWidth * posterRatio;
    const verticalPadding = tileHeight * innerPaddingY; 
    let maxFilmCount = d3.max(individualData.map(f => f.filmCount));
    let maxReleaseCount = d3.max(deduplicatedData.map(f => f.releaseCount)); // todo: can be computed simult.
    let releaseHeight = tileHeight * maxReleaseCount + verticalPadding * (maxReleaseCount - 1);
    let height = tileHeight * maxFilmCount + verticalPadding * (maxFilmCount - 1);
    // 150 is axis height
    let extraHeight = height > window.innerHeight - 150 ? 0 : window.innerHeight - 150 - height;

    // Parse the date / time
    var	parseDate = d3.timeFormat("%Y-%m").parse;

    //var y = d3.scaleLinear().rangeRound([height, 0]);
    let enumToMax = m => {let a = []; for (let i = 1; i <= m; i++) {a[i-1] = i} return a};

    // watched mode
    var y = d3.scaleBand().rangeRound([height, 0]).paddingInner(innerPaddingY);
    y.domain(enumToMax(maxFilmCount));

    // release mode
    var yRelease = d3.scaleBand().rangeRound([releaseHeight, 0]).paddingInner(innerPaddingY);
    yRelease.domain(enumToMax(maxReleaseCount));
    
    // yearAxis for watched date
    var yearAxis= d3.axisBottom(x);
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

    // yearAxis for release view
    var yearAxisRelease = d3.axisBottom(xRelease);
    // yearAxisRelease.tickValues(xRelease.domain().filter((d,i,a) => d % 10 == 0));
    yearAxisRelease.tickValues(xRelease.domain().filter(d => false));

    // monthAxis for watched view
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
    
    // month for release view
    var monthAxisRelease = d3.axisBottom(xRelease);
    //monthAxisRelease.tickFormat(d => "'" + String(d).slice(2));
    //console.log(xRelease.domain());
    //monthAxisRelease.tickValues(xRelease.domain().filter(d => d % 5 == 0 && d & 10 !== 0));
    monthAxisRelease.tickFormat(d => (d % 5 == 0) ? d : "");

    // y axis for watched view
    var yAxis = d3.axisLeft(y);

    // y axis for release view
    var yAxisRelease = d3.axisLeft(yRelease);

    // CONTROLS
    //
    // 

    var controls = d3.select("body").append("div").attr("class","controls card").html(`
        <span class="controls__title"><strong>view by</strong></span>
        <div class="controls__options" id="control-viewmodes">
            <span class="controls__option" id="control-viewmode-release">release date</span>
            |
            <span class="controls__option" id="control-viewmode-watched" >watched date</span>
        </div>
        <span class="controls__title"><strong>actions</strong></span>
        <div class="controls__options">
            <span class="controls__option block" id="control-favorites">show favorites only</span>
            <span class="controls__option block" id="fullscreen-toggle">go fullscreen</span>
        </div>
        <span class="controls__title"><strong><a style="text-decoration: none; color: #fff;" href="https://airtable.com/shr9VA8GxYb77zw4U" target="_blank">tell me what to watch 🍿</a></strong></span>
    `);

    document.getElementById("fullscreen-toggle").addEventListener("click", (event) => {
        if (screenfull.enabled) {
            screenfull.toggle();
            event.target.classList.toggle("active");
        }
    })

    document.getElementById("control-favorites").addEventListener("click", toggleFavorites);
    document.getElementById("control-viewmodes").addEventListener("click", (e) => {
        switch (e.target.id) {
            case "control-viewmode-release":
                setReleaseMode();
                break;
            case "control-viewmode-watched":
                setWatchedMode();
                break
            default: 
        }
    });

    function resetSelected() {
        selectedNode = null;
        selectedIndex = null;
    }

    function setReleaseMode() {
        mode = mode instanceof ReleaseMode ? mode : new ReleaseMode();
        document.getElementById("control-viewmode-release").classList.add("active");
        document.getElementById("control-viewmode-watched").classList.remove("active");
        resetSelected()
        render();
    }

    function setWatchedMode() {
        mode = mode instanceof WatchedMode ? mode : new WatchedMode();
        document.getElementById("control-viewmode-watched").classList.add("active");
        document.getElementById("control-viewmode-release").classList.remove("active");
        resetSelected();
        render();
    }

    // DETAILS
    //
    //

    var details = d3.select("body").append("div")
    .attr("class", "details side card details--hidden").html(`
        <div class="details__content">
            <div class="details__close">
                <svg enable-background="new 0 0 100 100" version="1.1" viewBox="0 0 100 125" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><polygon points="82.2 11.5 49.7 44 17.2 11.5 10.8 17.8 43.3 50.3 10.8 82.8 17.2 89.2 49.7 56.7 82.2 89.2 88.5 82.8 56 50.3 88.5 17.8"/></svg>
            </div>
            <div class="details__top">
                <img class="details__img"/>
                <div class="details__props">
                    <h2 class="details__props__title"></h2>
                    <div class="details__props__year"></div>
                    <p class="details__props__facts"></p>
                </div>
            </div>
            <div class="details__bottom">
                <h3 class="details__text-title">Plot</h3>
                <p class="details__plot"></p>
                <div id="movie-comment">
                    <h3 class="details__text-title">Comment</h3> <i>by Thor</i>
                    <p class="details__comment"></p>
                </div>
            </div>
            <a class="details__links details__links__imdb">More on <img src="${imdbLogo}"/></a>
        </div>
    `);

    document.querySelector(".details__close").addEventListener("click", toggleOverlay);


    function toggleOverlay() {
        const details = d3.select(".details");
        details.classed("details--hidden", !details.classed("details--hidden"));

        if (!details.classed("details--hidden")) {
            resetSelected();
        }
    }

    function openOverlay() {
        d3.select(".details").classed("details--hidden", false);
    }

    // initial detail position
    details.node().style.right = "20px";
    details.node().style.top = "80px";

    // bind details dragging
    var isMoving = false;
    //const details = document.querySelector(".details");
    details.on("mousedown", (mE) => isMoving = true);
    details.on("mouseup", (mE) => isMoving = false);
    document.addEventListener("mousemove", (mE) => {
        if (isMoving) {
            const getNumber = str => {
                const match = /(\d{1,5})(px)?/.exec(str);
                return match ? +match[1] : 0;
            }
            const toString = n => String(n) + "px";
            const top = getNumber(details.node().style.top);
            const right = getNumber(details.node().style.right);
            details.node().style.top = toString(top + mE.movementY);
            details.node().style.right = toString(right - mE.movementX);
        }
    });

    function openDetails(d, i, a) {
        // open overlay
        openOverlay();
        selectedIndex = i ? i : selectedIndex;
        highlightSelected(d);
        
        const timeFadeOut = 350;
        const detailsContent = d3.select(".details__content");
        // if not hidden, do fadeout
        if (!d3.select(".details").classed("details--hidden")) {
            detailsContent.classed("fading-out", true);
            setTimeout(() => {
                changeDetailsContent();
                detailsContent.classed("fading-out", false)
            }, timeFadeOut);
        }

        // fill overlay
        function changeDetailsContent() {
            d3.select(".details__img").attr("src", d.Poster);
            d3.select(".details__props__title").text(d.Title);
            d3.select(".details__props__year").text(d.Year);
            d3.select(".details__props__facts").html(`${d.Genre}`).attr("title", d.Genre);
            d3.select(".details__plot").text(d.Plot);
            if (d.Comment && d.Comment.length) {
                document.getElementById("movie-comment").classList.remove("hidden");
                d3.select(".details__comment").html(d.Comment); // <-- potential script/html injection vulerability
                                                                // TODO: enable only safe tags
            } else {
                document.getElementById("movie-comment").classList.add("hidden");
            }
            d3.select(".details__links__imdb")
                .attr("href", `https://www.imdb.com/title/${d.imdbID}`)
                .attr("target", "_blank");
        }
        if (d.Color) {
            d3.select(".details").style("background", `radial-gradient(at 10% 10%, rgb(${d.Color.join(',')}), #000 90%)`);
        }
    }

    function scrollTopMax(el) {
        // client or offset? probably client --> scrollbars should not be calculated in
        return el.scrollHeight - el.clientHeight;
    }

    function scrollLeftMax(el) {
        return el.scrollWidth - el.clientWidth;
    }

    setTimeout(function() {
        // https://stackoverflow.com/questions/9236314/how-do-i-synchronize-the-scroll-position-of-two-divs
        var isSyncingLeftScroll = false;
        var isSyncingRightScroll = false;
        var leftDiv = document.querySelector(".axis-container");
        var rightDiv = document.querySelector('.movies-container');
        rightDiv.scrollTop = scrollTopMax(rightDiv);
        
        
        leftDiv.onscroll = function() {
        if (!isSyncingLeftScroll) {
            isSyncingRightScroll = true;
            rightDiv.scrollLeft = this.scrollLeft;
        }
        isSyncingLeftScroll = false;
        }
        
        rightDiv.onscroll = function() {
        if (!isSyncingRightScroll) {
            isSyncingLeftScroll = true;
            leftDiv.scrollLeft = this.scrollLeft;
        }
        isSyncingRightScroll = false;
        }
    }, 600);

    const containers = ["movies-container", "axis-container"];

    // STATIC SVG SETUP

    // Tooltips
    var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

    // initial render via first mode set
    setReleaseMode();

    // DYNAMIC CODE

    function render() {

        d3.select("body")
        .selectAll(containers.map(c => '.' + c).join())
        // key function necessary for intuitive enter/exits 
        // assumes that no title is watched twice in the same week
        // watchedDate safeguard in case available (same problem with day)
        .data(containers)
        .enter()
        .append("div")
        .attr("class", d => d);

        var topdiv = d3.select(".movies-container");

        var svg;
        // select old svg
        if (document.querySelector(".movie-svg > g")) {
            let oldMovieSvg = d3.select(".movie-svg");
            oldMovieSvg.attr("width", mode.getWidth() + margin.left + margin.right)
            //.attr("height", height + margin.top + margin.bottom)
            .attr("height", mode.getOuterHeight());
            svg = oldMovieSvg.select("g");
        // create new one
        } else {
            svg = topdiv
            .append("svg")
            .attr("class", "movie-svg")
            .attr("width", mode.getWidth() + margin.left + margin.right)
            //.attr("height", height + margin.top + margin.bottom)
            .attr("height", mode.getHeight())
            .append("g")
            .attr("transform", 
         //       "translate(" + margin.left + "," + margin.top + ")");
                "translate(" + margin.left + ", 0)");
        }
        
        let textColor = "#fff";

        // reset axes
        d3.selectAll(".axis-container > svg").remove();

        // recreate axes
        let botdiv = d3.select(".axis-container");
        let botsvg = botdiv.append("svg");
        let yearTicks = botsvg
            .attr("width", mode.getWidth() + margin.left + margin.right)
            .attr("height", 105) // to prevent a weird bug, -5 pixels
        .append("g")
        .attr("transform", "translate(" + margin.left + ", 0)");
        
        yearTicks
        .attr("class", "x axis axis--year")
        //.attr("transform", "translate(0," + height + ")")
        .call(mode.getYearAxis())
        .selectAll("text")
        .attr("class", "axis__year-ticks")
        .style("text-anchor", "start")
        .attr("dx", "-60")
        .attr("dy", "90")
        .attr("fill", textColor)
        //.attr("transform", "rotate(-90)" );
    
        d3.select(".axis--year .domain")
        .attr("transform", `translate(0, ${verticalPadding})`);
    
        let monthTicks = botsvg.append("g")
                        .attr("transform", "translate(" + margin.left + ", 0)");
        monthTicks
        .attr("class", "x axis axis--month")
        //.attr("transform", "translate(0," + height + ")")
        .call(mode.getMonthAxis())
        .selectAll("text")
        .attr("class", "axis__month-ticks")
        .style("text-anchor", "start")
        .attr("dx", "-23")
        .attr("dy", "60")
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

        // BARS
        //
        //

        const highlightClass = "movieTile--highlighted";
        
        let barsUpdate = svg.selectAll("g")
        //.data(data)
        .data(mode.getData(), keyFunction)
        console.log("Update size: ", barsUpdate.size());
        
        // remove old ones (duplicates like series when coming from watched view, or movies seen twice)
        barsUpdate.exit().remove();

        let bars = barsUpdate.enter();
        console.log("Enter size: ", bars.size());
    
        let gs = bars.append("g");
        let mergers = gs.merge(barsUpdate)
        .attr("transform", d => `translate(${mode.getX(d)}, ${mode.getInitialY()})`);
       
        // reset click handlers
        /*
            TODO learning journal:
            indices passed to d3 events seem to be static from when you bind them
            thus on("click", function (d,i,a) => ) is not "dynamic" & won't always give the its i of the latest data
            if the data key itself has not changed, it remembers the i from the first enter data
            might be transformed to addEventListener("click", function(event) => onClickHandler(d,i,a)) 
            with that function not being replaced

            indeed: tested. If the below segment is removed (reset)
            and you inspect the .on("click") below, then when changing the view,
            the d given will be correct. But the i will still be the one from releaseView (releasemode.getData()[i] === d)

            illustrate in a d3 bug: make a very simple setup that explains it
        */
        mergers
        .select("image,rect") // jump one level down
        .on('click', function(d, i, a) {
            openDetails(d, i, a);
        });

        // transition groups
        mergers
        .transition()
        .duration(2000)
        // + 1 because it seeems offf
        .attr("transform", d => `translate(${mode.getX(d)}, ${mode.getY(d)})`);

        let tooltipTimeout = null;
            
        // enter for creation
        gs.append(d => d.Poster && d.Poster.match(/https?/) ? document.createElementNS('http://www.w3.org/2000/svg', "image") 
            : document.createElementNS('http://www.w3.org/2000/svg', "rect"))
        // merge for location updates
        .attr("class", (d) => "movieTile" + (isFavorite(d) ? " favorite" : ""))
        .attr("id", keyFunction)
        .classed("movieTile--series", d => d.Type === "Series")
        // TODO: these are only used at .enter time. Should also be in update? Maybe with a d3.selectAll
        .attr("width", mode.getBandwidth())
        .attr("height", mode.getBandheight())
        .attr("xlink:href", function(d) { return d.Poster ? d.Poster : null})
        .attr("fill", function(d) {return d.Poster ? null : "grey"})
        .on('mouseover', function(d) {
            let ttoffsetx = 0;
            let ttoffsety = -100;
            this.classList.toggle(highlightClass);
    
            // tooltip.html(`${d3.timeFormat("%Y-%b-%e")(d.watchedDate)}\n${d.Title}`)
            tooltip.html(d.Title)
            .style("visibility", "visible")
            .style("top", d3.mouse(document.querySelector('body'))[1] + ttoffsety + "px")
            .style("left", d3.mouse(document.querySelector('body'))[0] + ttoffsetx + "px");
            // cancel pending tooltip hiding
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
            // show tooltip again
            tooltip.classed("tooltip--hidden", false);
        })
        .on('mouseout', function(d) {
            this.classList.toggle(highlightClass);
            // hide tooltip
            tooltipTimeout = setTimeout(() => {
                tooltip.classed("tooltip--hidden", true);
            }, 600);
        })
        .on('click', function(d, i, a) {
            openDetails(d, i, a);
        });

        gs.filter(isFavorite).append("image")
            .attr("x", "-15")
            .attr("y", "-4")
            .attr("width", "35").attr("height", "35")
            //.attr("class", "movieTile__favorite")
            .attr('xlink:href', flashIcon);

        const xb = 6;
        const yb = 5

        // TODO: mapping series 
        // gs.filter(d => d.Type === "Series")
        //     .insert("rect", ":first-child")
        //     .attr("width", mode.getBandwidth() + xb)
        //     .attr("height", mode.getBandheight() + yb)
        //     .attr("x", -xb/2)
        //     .attr("y", -yb/2)
        //     .attr("style",  d => `fill: rgb(${d.Color ? d.Color.join() : '128, 128, 128'}); filter: blur(3px)`)
        //     //.attr("class", "movieTile__favorite")
        //     //.attr('xlink:href', flashIcon);


        // scroll resets
        let movieCont = document.querySelector(".movies-container");
        if (mode instanceof ReleaseMode) {
            movieCont.scrollTop = scrollTopMax(movieCont);
            movieCont.scrollLeft = scrollLeftMax(movieCont);
        } else if (mode instanceof WatchedMode) {
            movieCont.scrollLeft = scrollLeftMax(movieCont);
        }
    }
}


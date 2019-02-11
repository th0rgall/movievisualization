import './style.scss';
import * as d3 from 'd3';
import display from './display.js';

function weeklyData(data) {
    let weeks = d3.timeWeeks.apply(this, d3.extent(data.map(m => m.watchedDate)));
    
    let di = 0; // data index
    let weeklyData = weeks.reduce((acc, cur, i, arr) => {
        let weekCount = 0;
        let films = [];
        // TODO: find better grouper, the weeks start at the sunday 12pm of monday night
        // while I expect them to end at the next sunday night? So everything shifted?
        // ==> adjust weeks extent above to generate end dates 
        while ( i < arr.length - 1 && di < data.length && data[di].watchedDate < arr[i + 1]) {
            weekCount++;
            films = [...films, data[di]];
            di++;
        }
    return [...acc, {week: cur, weekCount, films}]
    }, []);

    return weeklyData;
}

d3.json("movies.json", (data) => {
    // convert date strings to Date
    data = data.map(m => {m.watchedDate = new Date(m.watchedDate); return m}).sort((a,b) => a.watchedDate - b.watchedDate);
    display(weeklyData(data));
});
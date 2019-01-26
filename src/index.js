import './style.scss';
import * as d3 from 'd3';
import display from './display.js';
import display2 from './display2.js';

function weeklyData(data) {
    let weeks = d3.timeWeeks.apply(this, d3.extent(data.map(m => m.date)));
    
    let di = 0; // data index
    let weeklyData = weeks.reduce((acc, cur, i, arr) => {
        let weekCount = 0;
        let films = [];
        while ( i < arr.length - 1 && di < data.length && data[di].date < arr[i + 1]) {
            weekCount++;
            films = [...films, data[di]];
            di++;
        }
    return [...acc, {week: cur, weekCount, films}]
    }, []);

    return weeklyData;
}

function mergeUrls(data, urldata) {
    
    let mergedData = [];
    data.forEach((film, i) => {
        // bad n^2 algorithm, but easy
        const posterEntry = urldata.find(u => u.title === film.title);
        if (posterEntry) {
            mergedData[i] = {...film, imgUrl: posterEntry.imgUrl}
        } else {
            mergedData[i] = film;
        }
    });
    return mergedData;
}

d3.json("movies.json", (data) => {

    d3.json("posterUrls.json", (urls) => {

        data = data.map(m => {m.date = new Date(m.date); return m}).sort((a,b) => a.date - b.date);
        //display(data);

        display2(weeklyData(mergeUrls(data, urls)));
    });

});
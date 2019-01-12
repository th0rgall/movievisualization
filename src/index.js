import './style.scss';
import * as d3 from 'd3';
import display from './display.js';
import display2 from './display2.js';

d3.json("movies.json", (data) => {
    data = data.map(m => {m.date = new Date(m.date); return m}).sort((a,b) => a.date - b.date);
    display(data);

    let weeks = d3.timeWeeks.apply(this, d3.extent(data.map(m => m.date)));
    
    let di = 0; // data index
    let weeklyData = weeks.reduce((acc, cur, i, arr) => {
        let weekCount = 0;
        let films = [];
        while ( i < arr.length - 1 && di < data.length && data[di].date < arr[i + 1]) {
            weekCount++;
            films = [...films, data[di].title];
            di++;
        }
    return [...acc, {week: cur, weekCount, films}]
    }, []);
    console.log(weeklyData);

    display2(weeklyData);

});
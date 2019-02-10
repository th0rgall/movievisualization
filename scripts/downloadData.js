const omdb = require('./movieAPI.js');
const path = require('path');
const fs = require('fs');
const zip = require('lodash.zip');

const defaultPath = 'data/movies-airtable.json';
const defaultOut = 'dist/movies.json';

// read airtable movies
let fpath = '';
if (process.argv.length > 2) {
    fpath = path.resolve(process.argv[2]);
}
let moviesFile = fs.readFileSync(fpath ? fpath : defaultPath, 'utf8');
const moviesAirtable = JSON.parse(moviesFile);

const requests = moviesAirtable.filter(e => 
    e.Title && 
    e.Date && 
    e.Type && e.Type == 'Film' &&
    e.imdbID
   )
   .map(airMovie => omdb.getMovie(airMovie.imdbID));

// download data
Promise.all(requests
            // handle possible errors (Promise.all fails with one error)
            .map(promise => 
                new Promise((resolve, reject) => {
                    promise.then(resolve).catch(e => resolve(null));
             })))
    .then(apiMovies => {
        const countA = apiMovies.length;
        // filter out errored movies
        const filtered = apiMovies.filter(Boolean);
        const countB = filtered.length;
        fs.writeFile(defaultOut, JSON.stringify(filtered), {encoding: 'utf8'}, 
            err => console.log(err ? err : `omdb data downloaded for ${countB} of ${countA} movies.`)
        );
});
/* Uses omdb to download additional metadata for entries defined in a airtable-exported movie json.
 */
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

// read previous movies
let oldMovies = JSON.parse(fs.readFileSync('dist/movies.json', 'utf8'));

const moviesAirtableFiltered = moviesAirtable.filter(e => 
    e.Title && 
    e.Date && 
    e.Type && e.Type == 'Film' &&
    e.imdbID
   )

const moviesToRequest = [];
let newMovies = [...oldMovies];
moviesAirtableFiltered.forEach((airMovie) => {
    const titleChecker = (movie) => (movie.airTitle ? movie.airTitle : movie.Title) == airMovie.Title;
    const movFoundIndex = oldMovies.findIndex(titleChecker);
    // matching title
    if (movFoundIndex > -1) {
        const foundMovie = oldMovies[movFoundIndex];
        if ((foundMovie.imdbID != airMovie.imdbID) // id changed ==> remove & download again
               || (airMovie.Comment && !foundMovie.Comment) // Comment inserted
                || (airMovie.Comment && foundMovie.Comment && airMovie.Comment !== foundMovie.Comment) // comment changed
                || (airMovie.Favorite && !foundMovie.Favorite)
                || (!airMovie.Favorite && foundMovie.Favorite)
            ) {
            // delete this one
            newMovies = newMovies.filter((movie) => movie.Title != foundMovie.Title);
            moviesToRequest.push(airMovie);
        }
        // else: assume all is OK
    // not found: either new, or title mismatch (temporary problem, airTitle's should be there from 2nd run)
    } else {
        moviesToRequest.push(airMovie);
    }
});

// download data
const requests = moviesToRequest.map(airMovie => omdb.getMovie(airMovie.imdbID));
Promise.all(requests
            // handle possible errors (Promise.all fails with one error)
            .map(promise => 
                new Promise((resolve, reject) => {
                    promise.then(resolve).catch(e => {console.log(e); resolve(null)});
             })))
    .then(apiMovies => {
        const countA = apiMovies.length;
        // filter out errored movies
        const filtered = apiMovies.filter(Boolean);
        const countB = filtered.length;
        const combined = zip(moviesToRequest, apiMovies)
            // pure wizard object destructuring
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
            .map(([{"Date": airDate, "Title": airTitle, Comment, Favorite}, omdbData]) => (
                {"watchedDate": airDate, "Title": omdbData ? omdbData.Title : airTitle, airTitle, Comment, Favorite, ...omdbData}));
        fs.writeFile(defaultOut, JSON.stringify([...newMovies, ...combined]), {encoding: 'utf8'}, 
            err => console.log(err ? err : `omdb data downloaded for ${countB} of ${countA} new movies.`)
        );
});
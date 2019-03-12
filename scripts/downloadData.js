/* Uses omdb to download additional metadata for entries defined in a airtable-exported movie json.
 */
const omdb = require('./movieAPI.js');
const path = require('path');
const fs = require('fs');
const zip = require('lodash.zip');
const ColorThief = require('color-thief-jimp');
const Jimp = require('jimp');

// configuration
const alwaysColorDownload = false;

async function getColorFromUrl(imgUrl) {
    return await Jimp.read(imgUrl).then((sourceImage) => {

        const values = ColorThief.getColor(sourceImage);

        /* 
            I want poppy colors. The library doesn't seem to do this:
            sometimes if 10% is black and 90% yellow, then it will return black
        */

        // largest r, g or b is smaller than 25: it's a pretty dark color 
        if (max(values) < 30) {
            // find the most poppy color yourself
            const valuesArray = ColorThief.getPalette(sourceImage, 6);
            return valuesArray.reduce((acc, el) => 
                    variance(el) > variance(acc) ? el : acc, values);
        } else {
            return values;
        }
    })
}

safePromiseWrapper = promise => 
    new Promise((resolve, reject) => {
        promise.then(resolve).catch(e => {console.log("PROMISE WAS REJECTED (no problem, this movie will be ignored):\n" + e.toString()); resolve(null)});
    });

// basic statistical utility functions
function sum(array) {
    var num = 0;
    for (var i = 0, l = array.length; i < l; i++) num += array[i];
    return num;
}

function mean(array) {
    return sum(array) / array.length;
}

function variance(array) {
    const meanVal = mean(array);
    return mean(array.map(function(num) {
        return Math.pow(num - meanVal, 2);
    }));
}

function max(array) {
    return Math.max.apply(null, array);
}

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
    // e.Type && e.Type == 'Film' &&
    e.imdbID
   )

// promises for new/adjusted movies to be requested
const moviesToRequest = [];
// promises for existing json movies
let newMovies = [];
let updateCount = 0;

moviesAirtableFiltered.forEach((airMovie) => {
    // inefficient matching of airMovien and jsonMovie based on their original Title
    const titleChecker = (movie) => (movie.airTitle ? movie.airTitle : movie.Title) == airMovie.Title;
    const movFoundIndex = oldMovies.findIndex(titleChecker);
    // matching title
    if (movFoundIndex > -1) {
        const foundMovie = oldMovies[movFoundIndex];
        // ID changed ==> movie changed ==> request new
        if ((foundMovie.imdbID != airMovie.imdbID) // id changed ==> remove & download again
                ) {
            moviesToRequest.push(airMovie);
        // only data changed ==> merge air and json version
        } else if ((airMovie.Comment && !foundMovie.Comment) // Comment inserted
            || (airMovie.Comment && foundMovie.Comment && airMovie.Comment !== foundMovie.Comment) // comment changed
            || (airMovie.Favorite && !foundMovie.Favorite)
            || (!airMovie.Favorite && foundMovie.Favorite)
            || (alwaysColorDownload || !foundMovie.Color) // no color available
            // TODO: type might also change
        ) {
            newMovies.push(merge(airMovie, foundMovie));
            updateCount++;
        } else {
            // else: assume all is OK
            newMovies.push(Promise.resolve(foundMovie));
        }
    // not found: either new, or title mismatch (temporary problem, airTitle's should be there from 2nd run)
    } else {
        moviesToRequest.push(airMovie);
    }
});

// mergens old json with new airmovie (comment, favorite)
function merge(airMovie, jsonMovie) {
    return new Promise((resolve, reject) => {
        ({Comment, Favorite} = airMovie); // destructure
        let out = {
            ...jsonMovie,
            Comment, 
            Favorite
        };

        if (alwaysColorDownload || !jsonMovie.Color) {
            getColor(jsonMovie)
                .then(colorValues => {
                    resolve({...out, Color: colorValues});
                })
                .catch(() => {
                    resolve(out); // TODO: will be requested again
                });
        } else {
            resolve(out);
        }
    });
}

// gets the [r,g,b] main color for a movie
async function getColor(movie) {
    return movie.Poster ? await getColorFromUrl(movie.Poster) : null;
}


// download data
const requests = moviesToRequest.map(airMovie => omdb.getMovie(airMovie.imdbID));

Promise.all(requests
            // handle possible errors (Promise.all fails with one error)
            .map(safePromiseWrapper))
    .then(apiMovies => {
        const countA = apiMovies.length;
        // filter out errored movies
        const filtered = apiMovies.filter(Boolean);
        const countB = filtered.length;
        const promised = zip(moviesToRequest, apiMovies)
            // pure wizard object destructuring
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
            .map(([{"Date": airDate, "Title": airTitle, Comment, Favorite}, omdbData]) => (
                {"watchedDate": airDate, "Title": omdbData ? 
                    omdbData.Title : airTitle, airTitle, Comment, Favorite, ...omdbData}))
            // TODO: debugged very long for this one... Promise.resolve has to be bound to promise...
            .map(Promise.resolve.bind(Promise));

        Promise.all([...newMovies, ...promised].map(safePromiseWrapper)).then(
            (finalMovies) => {
                fs.writeFile(defaultOut, JSON.stringify(finalMovies), {encoding: 'utf8'}, 
                    err => console.log(err ? err : 
                        `omdb data downloaded for ${countB} new movies. ${countA} not found.
                        ${updateCount} comments/favs updated.`)
                );
            }
        );
    });


const fs = require('fs');
const path = require('path');
const request = require('request-promise');
const querystring = require('querystring');


let fpath = '';
if (process.argv.length > 1) {
    fpath = path.resolve(process.argv[2]);
}
let moviesFile = fs.readFileSync(fpath ? fpath : 'dist/movies.json', 'utf8');
const movies = JSON.parse(moviesFile);

let posterUrls = [];

function writeUrls() {
    fs.writeFileSync('posterUrls.json', JSON.stringify(posterUrls), {encoding: 'utf8'});
}

movies.filter(e => e.Title && e.Date && e.Type && e.Type == "Film").forEach((element, i, a) => {
    const params = {
        apikey: '5ad91e18',
        s: element.Title,
    };

    request(`http://www.omdbapi.com/?${querystring.stringify(params)}`, {json: true})
    .then( result => {
        if (result.Response === "False") {
            console.log(`Item '${element.Title}' not found, error '${result.Error}'`)
        } else if (result.Response === "True") {
            const firstHit = result.Search[0]; 
            if (firstHit.Poster) {
                posterUrls.push({title: element.Title, imgUrl: firstHit.Poster, rest: firstHit});
            }
        }

        // last successful requests starts the write
        if (i === a.length - 1) {
            writeUrls();
        }
    })
    .catch(console.log);
});
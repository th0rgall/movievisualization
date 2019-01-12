const fs = require('fs');
const path = require('path');
const request = require('request-promise');
const querystring = require('querystring');


let path = '';
if (process.argv.length > 1) {
    path = path.resolve(process.argv[1]);
}
const moviesFile = fs.readFileSync(path ? path : 'dist/movies.json', 'utf8');
const movies = JSON.parse(moviesFile);

let posterUrls = [];

function writeUrls() {
    fs.writeFileSync('posterUrls.json', JSON.stringify(posterUrls), {encoding: 'utf8'});
}

movies.forEach((element, i, a) => {
    const params = {
        apikey: '5ad91e18',
        s: element.title,
    };

    request(`http://www.omdbapi.com/?${querystring.stringify(params)}`, {json: true})
    .then( result => {
        if (result.Response === "False") {
            console.log(`Item '${element.title}' not found, error '${result.Error}'`)
        } else if (result.Response === "True") {
            const firstHit = result.Search[0]; 
            if (firstHit.Poster) {
                posterUrls.push({title: element.title, imgUrl: firstHit.Poster});
            }
        }

        // last successful requests starts the write
        if (i === a.length - 1) {
            writeUrls();
        }
    })
    .catch(console.log);
});
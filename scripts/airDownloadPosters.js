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

function writeUrls(urls) {
    fs.writeFileSync('dist/posterUrls.json', JSON.stringify(urls), {encoding: 'utf8'});
}

// TODO: use map & https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
// DONE: learned, this is more reliable... why? dunno. Something with push?

const moviesFiltered = movies.filter(e => e.Title && e.Date && e.Type && e.Type == "Film");

let requests = moviesFiltered.map(element => {
    
    const params = {
        apikey: '5ad91e18',
        s: element.Title,
    };

    return request(`http://www.omdbapi.com/?${querystring.stringify(params)}`, {json: true})
    .then( result => {
        if (result.Response === "False") {
            console.log(`Item '${element.Title}' not found, error '${result.Error}'`);
            return null;
        } else if (result.Response === "True") {
            const firstHit = result.Search[0]; 
            if (firstHit.Poster) {
                return {title: element.Title, imgUrl: firstHit.Poster, rest: firstHit};
            } else {
                console.log(`Poster for '${element.Title}' not found, error '${result.Error}'`)
                return {title: element.Title};
            }
        }
    })
    .catch(console.log);
});

Promise.all(requests).then((data) => {
    writeUrls(data.filter(Boolean));
})
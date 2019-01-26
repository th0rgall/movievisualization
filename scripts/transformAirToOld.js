const fs = require('fs');
const path = require('path');


let fpath = '';
if (process.argv.length > 1) {
    fpath = path.resolve(process.argv[2]);
}
const moviesFile = fs.readFileSync(fpath ? fpath : 'dist/movies.json', 'utf8');
const movies = JSON.parse(moviesFile);

const outObj = movies
                .filter(e => e.Title && e.Date && e.Type && e.Type == "Film")
                .map(e => {
                    let mObj = {};
                    let date = new Date(Date.parse(e.Date));
                    if (date) {
                        mObj.date = date; 
                    } else {
                        console.log(`Could not parse date from '${e.Title}'`);
                    }
                    mObj.title = e.Title;
                    return mObj;
                })
                .filter(o => !!o.date);

fs.writeFileSync('movies.json', JSON.stringify(outObj), {encoding: 'utf8'});


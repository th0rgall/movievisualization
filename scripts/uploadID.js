const fs = require('fs');
const path = require('path');
let fpath = '';
if (process.argv.length > 1) {
    fpath = path.resolve(process.argv[2]);
}
const moviesFile = fs.readFileSync(fpath ? fpath : 'data/moviesRaw.json', 'utf8');
const movies = JSON.parse(moviesFile);

// get all record ids

let airrecords = [];

var Airtable = require('airtable');
var base = new Airtable({apiKey: 'keyAGn5GfzATd0XOP'}).base('appLTEluHlM4eYHxh');

base('List').select({
    // Selecting the first 3 records in Grid view:
    // maxRecords: 3,
    view: "Grid view"
}).eachPage(function page(records, fetchNextPage) {
    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
        console.log('Retrieved', record.get('Title'));
        airrecords.push({title: record.get('Title'), id: record.getId()});
    });

    // To fetch the next page of records, call `fetchNextPage`.
    // If there are more records, `page` will get called again.
    // If there are no more records, `done` will get called.
    fetchNextPage();

}, function done(err) {
    if (err) { console.error(err); return; } else {
        updateIDs();
    }
});

//////
function updateIDs() {
    movies.forEach(m => {
        // TODO: add test step, don't update if existing
        let f = airrecords.find(a => a.title == m.title);
        if (f) {
            base('List').update(f.id, {
                "imdbID": m.rest.imdbID
              }, function(err, record) {
                  if (err) { console.error(err); return; }
                  console.log(`${record.get('Title')} UPDATED`);
              });
        }
    });
}

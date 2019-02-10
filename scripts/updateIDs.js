
const omdb = require('./movieAPI.js');
const creds = require('./credentials.json');

// get all record airtable ids
let airrecords = [];

var Airtable = require('airtable');
var base = new Airtable({apiKey: creds.airtableKey}).base(creds.airtableBase);

base(creds.airtableBaseName).select({
    // Selecting the first 3 records in Grid view:
    // maxRecords: 3,
    view: "Grid view"
}).eachPage(function page(records, fetchNextPage) {
    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
        console.log('Retrieved', record.get('Title'));
        airrecords.push({
            title: record.get('Title'), 
            id: record.getId(),
            imdbID: record.get('imdbID')});
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

/**
 * fills in missing imdbID's with a lookup 
 */
function updateIDs() {
    airrecords.forEach((record) => {
        // lookup
        if (!record.imdbID) {
            omdb.search(record.title)
            .then(({searchTerm, data}) => 
                base(creds.airtableBaseName).update(record.id, {
                    "imdbID": data.imdbID
                })
            )
            .catch(e => console.log(e instanceof Error ? e.message : "Error"));
        }
    })
}
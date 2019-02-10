csvtojson data/data.csv > data/movies-airtable.json \
&& node scripts/updateIDs.js \
&& node scripts/downloadData.js;
csvtojson data/data.csv > data/moviesRaw.json \
&& node scripts/transformAirToOld.js data/moviesRaw.json \
&& node scripts/airDownloadPosters.js data/moviesRaw.json;

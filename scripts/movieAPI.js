const request = require('request-promise');
const querystring = require('querystring');

const params = {
    apikey: '5ad91e18',
};

/**
 * Returns the first search result if found in the form of {searchTerm: searchterm, data}
 * @param {} searchTerm 
 */
exports.search = function(searchTerm) {
    return request(`http://www.omdbapi.com/?${querystring.stringify({s: searchTerm, ...params})}`, {json: true})
    .then( result => {
        if (result.Response === "False") {
            console.log(`Item '${searchTerm}' not found, error '${result.Error}'`);
            throw Error(result.Error);
        } else if (result.Response === "True") {
            const firstHit = result.Search[0]; 
            if (firstHit.Poster) {
                return {searchTerm, data: firstHit};
            }
        }
    })
};

exports.getMovie = function(imdbID) {
    return request(`http://www.omdbapi.com/?${querystring.stringify({i: imdbID, ...params})}`, {json: true})
    .then( result => {
        if (result.Response === "False") {
            console.log(`Item '${imdbID}}' not found, error '${result.Error}'`);
            throw Error(result.Error);
        } else if (result.Response === "True") {
            return result;
        }
    })
}

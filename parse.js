fs = require('fs')

const zip = rows=>rows[0].map((_,c)=>rows.map(row=>row[c]))

fs.readFile('./data.raw', 'utf8', (err, data) => {
    if (err) throw err;
    parse(data);
  });

function parse(data) {
    let lines = data.split(/\r?\n/);
    let reg = /(\b(\S+\s?){1,7}\b).*?\(.*?((\d{1,2}\/){2}(\d{2,4})).*?\)/i;

    let rfilter = (lines) => lines.filter((s) => reg.test(s));

    // dd/mm/yy to a Date
    let toDate = (s) => {
        const match = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(s);
        if (match) {
            return new Date(match[3].length == 2 ? "20" + match[3] : match[3], match[2] - 1, match[1]);
        } else {
            return null;
        }
    }
        
    let rparse = (lines) => lines.map(
        (s) => {
            let matches = reg.exec(s);
            if (matches) {
                return [matches[1], toDate(matches[3])];
            } else {
                return null;
            }
        }
    )

    //console.log(rparse(rfilter(lines)));
    zip([lines, rparse(lines)]).forEach((c) => console.log(`${c[0]}      -->      ${c[1]}`));

    //console.log(zip([lines, lines.map((s) => reg.test(s))]));

}
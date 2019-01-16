fs = require('fs')

const zip = rows=>rows[0].map((_,c)=>rows.map(row=>row[c]))

fs.readFile(process.argv.length > 2 ? process.argv[2] : './data.raw', 'utf8', (err, data) => {
    if (err) throw err;
    let movies = parse(data);
    fs.writeFile("movies.json", JSON.stringify(movies), (err) => {
        if (err) {console.log(err)} else {console.log("Movies saved!")}
    })
  });

function parse(data) {
    let lines = data.split(/\r?\n/);
    let reg = /(\b(\S+\s?){1,7}\b).*?\(.*?((\d{1,2}\/){2}(\d{2,4})).*?\)/i;

    let rfilter = (lines) => lines.filter((s) => reg.test(s));

    // dd/mm/yy[yy] to a Date(yyyy, mm, dd)
    // mm is indexed 0 - 11
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
                return {title: matches[1], date: toDate(matches[3]), original: s};
            } else {
                console.log(s);
                return {title: "", date: undefined, original: s};
            }
        }
    )

    let lastOfLast = (acc) => {
        const a = acc[acc.length - 1];
        return a[a.length - 1];
    }

    let group = (arr) => arr.reduce((acc, e, i, a) => {
        //console.log(e);
        if (!e) {
            return acc;
        } else if (acc.length > 0 && e.date.getMonth() === lastOfLast(acc).date.getMonth()) {
            acc[acc.length - 1].push(e);
            return acc;
        }
        else {
            acc.push([e]);
            return acc;
        }
    }, []);

    let sorted = (lines) => rparse(lines).filter(eval).sort((a,b) => a.date && b.date && a.date > b.date ? 1 : -1);

    let countInner = (arr) => arr.map((e) => e.length);

    let countToObj = (grouped) => grouped.map((group) => {
            if (group.length) {
                return {date: group[0].date, movies: group.map(m => m.title)};
            } else {
                return null;
            }
        })

    //console.log(countToObj(group(sorted(lines))));

    

    //console.log(rparse(lines).filter(eval).sort((a,b) => a.date > b.date ? 1 : -1));
    //zip([lines, rparse(lines)]).forEach((c) => console.log(`${c[0]}      -->      ${c[1]}`));
    //console.log(zip([lines, lines.map((s) => reg.test(s))]));

    var Airtable = require('airtable');
    var base = new Airtable({apiKey: 'keyAGn5GfzATd0XOP'}).base('appLTEluHlM4eYHxh');
    
    const out = sorted(lines);

    out.forEach(el => {
        base('Table 1').create({
            "Title": el.title,
            // "Type": "Film",
            "Original string": el.original,
            // "From year": "2013",
            "Watched date": el.date
          }, function(err, record) {
              if (err) { console.error(err); return; }
              console.log(record.getId());
          });
    });

    return out;
}
// normalize the history data. this includes sorting entries
// from oldest to newest, and filling in gaps between days.
export function normalize(history) {

    // console.log ('sorted', history.slice(0)
    //     .sort((a, b) => a.date > b.date));
    //
    // console.log('filled', history.slice(0)
    //     .sort((a, b) => a.date > b.date)
    //     .reduce((arr, current, i) => fillMissingDates(history, arr, current, i), []))

    return history.slice(0)
        .sort((a, b) => a.date > b.date)
        .reduce(fillMissingDates, [])
        .map(attachDayOfWeek);
}

// reduce function to fill the gaps between history entries
function fillMissingDates(arr, current, i, history) {
    // add the current entry to the history
    arr.push(current);

    // fill in any gaps between the current and next entry
    const next = history[i + 1];

    if (next) {
        let tomorrow = new Date(current.date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        while (getDateString(tomorrow) < next.date) {
            console.log ('doing it', getDateString(tomorrow), next.date)
            arr.push({ date: getDateString(tomorrow), value: null });
            tomorrow.setDate(tomorrow.getDate() + 1);
        }
    }

    return arr;
}

// identify each history entry with the day of the week
function attachDayOfWeek({ date, value }) {
    const day = new Date(date).getDay();
    return { date, day, value };
}

// convert a Date object to a YYYY/MM/DD string
function getDateString(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '/');
}

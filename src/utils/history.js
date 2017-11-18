// normalize the history data. this includes sorting entries
// from oldest to newest, and filling in gaps between days.
export function normalize(hist) {
    return hist.slice(0)
        .sort((a, b) => a.date > b.date)
        .reduce(fillMissingDates, [])
        .map(attachDayOfWeek);
}

// validate that the history prop is in the correct format
export function validate(hist) {
    // make sure history is present
    if (typeof hist === 'undefined') {
        throw 'Missing required "history" prop.';
    }

    // make sure the history is an array
    if (!Array.isArray(hist)) {
        throw 'History must be an array.';
    }

    // make sure each item in the history is valid
    for (let item of hist) {

        // items must be objects
        if (typeof item !== 'object' || Array.isArray(item)) {
            throw 'All history items must be objects with "date" and "value" properties.';
        }

        // items must have valid dates
        if (typeof item.date !== 'string' || !item.date.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
            throw `Invalid history date. Expected YYYY/MM/DD string, got ${item.date}.`;
        }

        // items must have a valid value
        if (typeof item.value !== 'number' || item.value < 0 || item.value === Infinity) {
            throw `Invalid history value. Expected positive number, got ${item.value}.`
        }
    }
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

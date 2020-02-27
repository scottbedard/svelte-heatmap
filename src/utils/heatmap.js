import {
    getMonthEnd,
    getMonthStart,
    getWeekEnd,
    getWeekStart,
    normalizeDate,
} from './date';

/**
 * Divide a calendar into months.
 *
 * @param {Array<Object>}   calendar
 *
 * @return {Array<Array<Object>>} 
 */
export function chunkMonths(calendar) {
    let prevMonth = -1;

    return calendar.reduce((acc, day) => {
        const currentMonth = day.date.getMonth();

        if (prevMonth !== currentMonth) {
            acc.push([]);
            prevMonth = currentMonth;
        }

        acc[acc.length - 1].push(day);

        return acc;
    }, []);
}

/**
 * Divide a calendar into weeks.
 *
 * @param {Array<Object>}   calendar
 *
 * @return {Array<Array<Object>>} 
 */
export function chunkWeeks(calendar) {
    return calendar.reduce((acc, day, index) => {
        if (index % 7 === 0) {
            acc.push([]);
        }

        acc[acc.length - 1].push(day);

        return acc;
    }, []);
}

/**
 * Determine the first day rendered on the heatmap.
 *
 * @param {Object}              props
 * @param {Array<string>}       props.colors
 * @param {Array<Object>}       props.data
 * @param {string}              props.emptyColor
 * @param {Date|number|string}  props.endDate
 * @param {Date|number|string}  props.startDate
 * @param {string}              props.view
 *
 * @return {Date}
 */
export function getCalendar({ colors, data, emptyColor, endDate, startDate, view }) {
    startDate = startDate ? normalizeDate(startDate) : new Date();
    endDate = endDate ? normalizeDate(endDate) : new Date();

    if (view === 'monthly') {
        startDate = getMonthStart(startDate);
        endDate = getMonthEnd(endDate);
    } else {
        startDate = getWeekStart(startDate);
        endDate = getWeekEnd(endDate);
    }

    let max = 0;
    const startDayOfMonth = startDate.getDate();
    const totalDays = Math.floor((endDate - startDate) / 86400000) + 1; // 86400000 = 1000 * 60 * 60 * 24

    return new Array(totalDays)
        .fill()
        .map((x, offset) => {
            const day = getDay({ data, offset, startDate, startDayOfMonth });

            if (day.value > max) {
                max = day.value;
            }

            return day;
        }).map(({ date, value }) => {
            let color = getColor({ colors, max, value }) || emptyColor;

            return { color, date, value }
        });
}

/**
 * Determine what color a value should be.
 *
 * @param {options}         options
 * @param {Array<string>}   options.colors
 * @param {number}          options.max
 * @param {number}          options.value
 *
 * @return {string|null}
 */
export function getColor({ colors, max, value }) {
    if (colors.length && value) {
        let color = colors[0];

        const intencity = value / max;

        for (let i = 1; i < colors.length; i++) {
            if (intencity < i / colors.length) {
                return color;
            }
            
            color = colors[i];
        }
    }

    return null;
}

/**
 * Aggregate the value of each day.
 *
 * @param {Object}          options
 * @param {Array<Object>}   options.data
 * @param {number}          options.offset
 * @param {number}          options.startDayOfMonth
 * @param {Date}            options.startDate
 *
 * @return {Object}
 */
export function getDay({ data, offset, startDate, startDayOfMonth }) {
    const date = new Date(startDate);
    date.setDate(startDayOfMonth + offset);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const value = data.reduce((acc, obj) => {
        const datapoint = normalizeDate(obj.date);

        return datapoint >= date && datapoint < nextDate ? acc + obj.value : acc;
    }, 0);

    return { date, value };
}
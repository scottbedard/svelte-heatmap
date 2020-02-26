import {
    getMonthEnd,
    getMonthStart,
    getWeekEnd,
    getWeekStart,
    normalizeDate,
} from './date';

/**
 * Determine the first day rendered on the heatmap.
 *
 * @param {Object}              props
 * @param {Array<Object>}       props.data
 * @param {Date|number|string}  props.endDate
 * @param {Date|number|string}  props.startDate
 * @param {string}              props.view
 *
 * @return {Date}
 */
export function getCalendar({ data, endDate, startDate, view }) {
    startDate = startDate ? normalizeDate(startDate) : new Date();
    endDate = endDate ? normalizeDate(endDate) : new Date();

    if (view === 'monthly') {
        startDate = getMonthStart(startDate);
        endDate = getMonthEnd(endDate);
    } else {
        startDate = getWeekStart(startDate);
        endDate = getWeekEnd(endDate);
    }

    const days = Math.floor((endDate - startDate) / 86400000) + 1; // 86400000 = 1000 * 60 * 60 * 24
    const startDayOfMonth = startDate.getDate();

    return new Array(days)
        .fill()
        .map((x, offset) => getCalendarValue({
            data,
            offset,
            startDate,
            startDayOfMonth,
        }));
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
export function getCalendarValue({ data, offset, startDate, startDayOfMonth }) {
    const date = new Date(startDate);
    date.setDate(startDayOfMonth + offset);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const value = data.reduce((acc, obj) => {
        const datapoint = normalizeDate(obj.date);

        return datapoint >= date && datapoint < nextDate
            ? acc + obj.value
            : acc;
    }, 0);

    return { date, value };
}
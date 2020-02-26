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

    const dayCount = Math.floor((endDate - startDate) / 86400000) + 1; // 86400000 = 1000 * 60 * 60 * 24

    return new Array(dayCount).fill().map((x, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const value = data.reduce((acc, obj) => {
            const dataDate = normalizeDate(obj.date);

            if (dataDate >= date && dataDate <= nextDate) {
                acc += obj.value;
            }

            return acc;
        }, 0);

        return { date, value };
    });
}
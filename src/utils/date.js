/**
 * Get the last day of the month.
 *
 * @param {Date} date
 *
 * @return {Date}
 */
export function getMonthEnd(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get the first day of the month.
 *
 * @param {Date} date
 *
 * @return {Date}
 */
export function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the week.
 *
 * @param {Date} date
 *
 * @return {Date}
 */
export function getWeekEnd(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay()));
}

/**
 * Return the week index of a date.
 *
 * @param {Date} date
 *
 * @return {number}
 */
export function getWeekIndex(date) {
    const firstWeekday = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const offsetDate = date.getDate() + firstWeekday - 1;

    return Math.floor(offsetDate / 7);
}

/**
 * Get the first day of the week.
 *
 * @param {Date} date
 *
 * @return {Date}
 */
export function getWeekStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

/**
 * Normalize to a javascript Date object.
 *
 * @param {Date|number|string} value
 *
 * @return {Date}
 */
export function normalizeDate(value) {
    if (value instanceof Date) {
        return value;
    }

    if (['number', 'string'].includes(typeof value)) {
        return new Date(value);
    }

    throw new Error('Invalid date value');
}

/**
 * Stringify a date.
 *
 * @param {Date} date
 * 
 * @return {string}
 */
export function stringifyDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

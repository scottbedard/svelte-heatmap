/**
 * Convert a date value to a javascript Date object.
 *
 * @param {Date|number|string} value
 * @return {Date}
 */
export function convertToDate(value) {
    if (value instanceof Date) {
        return value;
    }

    if (['number', 'string'].includes(typeof value)) {
        return new Date(value);
    }

    throw new Error('Invalid date value');
}

/**
 * Get the last day of the month.
 *
 * @param {Date} date
 * @return {Date}
 */
export function getMonthEnd(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get the first day of the month.
 *
 * @param {Date} date
 * @return {Date}
 */
export function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the year.
 *
 * @param {Date} date
 * @return {Date}
 */
export function getYearEnd(date) {
    return new Date(date.getFullYear(), 11, 31);
}

/**
 * Get the first day of the year.
 *
 * @param {Date} date
 * @return {Date}
 */
export function getYearStart(date) {
    return new Date(date.getFullYear(), 0, 1);
}
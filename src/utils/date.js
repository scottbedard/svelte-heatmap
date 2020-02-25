/**
 * Convert a date value to a javascript Date object.
 *
 * @param  {Date|number|string} value
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
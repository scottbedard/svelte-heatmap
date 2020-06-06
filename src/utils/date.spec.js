import {
    getMonthEnd,
    getMonthStart,
    getWeekEnd,
    getWeekIndex,
    getWeekStart,
    normalizeDate,
    stringifyDate,
} from './date';

describe('date utils', () => {
    //
    // getMonthEnd
    //
    describe('getMonthEnd', () => {
        Object.entries({
            '2020-01-01': '2020-01-31',
            '2020-01-15': '2020-01-31',
            '2020-01-31': '2020-01-31',
            '2020-02-28': '2020-02-29',
            '2020-02-29': '2020-02-29', // <- leap day
        }).forEach(([date, expected]) => {
            it(`${date} -> ${expected}`, () => {
                const d = getMonthEnd(new Date(`${date}T00:00:00`));
                const actual = stringifyDate(d);

                expect(actual).toBe(expected);
            });
        });
    });

    //
    // getMonthStart
    //
    describe('getMonthStart', () => {
        Object.entries({
            '2020-01-01': '2020-01-01',
            '2020-01-15': '2020-01-01',
            '2020-01-31': '2020-01-01',
            '2020-02-28': '2020-02-01',
            '2020-02-29': '2020-02-01', // <- leap day
        }).forEach(([date, expected]) => {
            it(`${date} -> ${expected}`, () => {
                const d = getMonthStart(new Date(`${date}T00:00:00`));
                const actual = stringifyDate(d);

                expect(actual).toBe(expected);
            });
        });
    });

    //
    // getWeekEnd
    //
    describe('getWeekEnd', () => {
        Object.entries({
            '2019-12-31': '2020-01-04',
            '2020-01-05': '2020-01-11',
            '2020-01-08': '2020-01-11',
            '2020-01-11': '2020-01-11',
        }).forEach(([date, expected]) => {
            it(`${date} -> ${expected}`, () => {
                const d = getWeekEnd(new Date(`${date}T00:00:00`));
                const actual = stringifyDate(d);

                expect(actual).toBe(expected);
            });
        });
    });

    //
    // getWeekIndex
    //
    describe('getWeekIndex', () => {
        Object.entries({
            '2020-01-01': 0,
            '2020-01-04': 0,
            '2020-01-05': 1,
            '2020-01-08': 1,
            '2020-01-15': 2,
            '2020-01-22': 3,
            '2020-01-31': 4,
        }).forEach(([date, expected]) => {
            it(`${date} -> ${expected}`, () => {
                const index = getWeekIndex(new Date(`${date}T00:00:00`));

                expect(index).toEqual(expected);
            });
        });
    });

    //
    // getWeekStart
    //
    describe('getWeekStart', () => {
        Object.entries({
            '2020-01-01': '2019-12-29',
            '2020-01-05': '2020-01-05',
            '2020-01-08': '2020-01-05',
            '2020-01-11': '2020-01-05',
        }).forEach(([date, expected]) => {
            it(`${date} -> ${expected}`, () => {
                const d = getWeekStart(new Date(`${date}T00:00:00`));
                const actual = stringifyDate(d);

                expect(actual).toBe(expected);
            });
        });
    });

    //
    // normalizeDate
    //
    describe('normalizeDate', () => {
        it('returns a date object', () => {
            const date = new Date('2020-01-02');

            expect(normalizeDate(date)).toBe(date);
        });

        it('converts a number', () => {
            expect(normalizeDate(1577923200000)).toBeInstanceOf(Date);
        });

        it('converts a string', () => {
            expect(normalizeDate('2020-01-02')).toBeInstanceOf(Date);
        });

        it('throws an error for invalid input', () => {
            expect(() => normalizeDate(null)).toThrow();
        });
    });
});
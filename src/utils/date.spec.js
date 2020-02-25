import {
    convertToDate,
    getMonthEnd,
    getMonthStart,
    getYearEnd,
    getYearStart,
} from './date';

describe('date utils', () => {
    describe('convertToDate', () => {
        it('returns a date object', () => {
            const date = new Date('2020-01-02');

            expect(convertToDate(date)).toBe(date);
        });

        it('converts a number', () => {
            expect(convertToDate(1577923200000)).toBeInstanceOf(Date);
        });

        it('converts a string', () => {
            expect(convertToDate('2020-01-02')).toBeInstanceOf(Date);
        });

        it('throws an error for invalid input', () => {
            expect(() => convertToDate(null)).toThrow();
        });
    });

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
                const actual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                expect(actual).toBe(expected);
            });
        });
    });

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
                const actual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                expect(actual).toBe(expected);
            });
        });
    });

    describe('getYearEnd', () => {
        Object.entries({
            '2020-01-01': '2020-12-31',
            '2020-01-15': '2020-12-31',
            '2020-01-31': '2020-12-31',
            '2020-12-31': '2020-12-31',
        }).forEach(([date, expected]) => {
            it(`${date} -> ${expected}`, () => {
                const d = getYearEnd(new Date(`${date}T00:00:00`));
                const actual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                expect(actual).toBe(expected);
            });
        });
    });

    describe('getYearStart', () => {
        Object.entries({
            '2020-01-01': '2020-01-01',
            '2020-01-15': '2020-01-01',
            '2020-01-31': '2020-01-01',
            '2020-12-31': '2020-01-01',
        }).forEach(([date, expected]) => {
            it(`${date} -> ${expected}`, () => {
                const d = getYearStart(new Date(`${date}T00:00:00`));
                const actual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                expect(actual).toBe(expected);
            });
        });
    });
});
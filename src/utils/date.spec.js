import {
    convertToDate,
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
});
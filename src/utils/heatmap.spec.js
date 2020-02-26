import {
    getCalendar,
} from './heatmap';

const stringifyDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('heatmap utils', () => {
    describe('getCalendar', () => {
        it('weekly start and end dates', () => {
            const calendar = getCalendar({
                data: [],
                startDate: '2020-01-15T00:00:00',
                endDate: '2020-01-16T00:00:00',
                view: 'weekly',
            });

            const startDate = calendar[0].date;
            const endDate = calendar[calendar.length - 1].date;
            
            expect(stringifyDate(startDate)).toBe('2020-01-12');
            expect(stringifyDate(endDate)).toBe('2020-01-18');
        });

        it('monthly start and end dates', () => {
            const calendar = getCalendar({
                data: [],
                startDate: '2020-01-15T00:00:00',
                endDate: '2020-01-16T00:00:00',
                view: 'monthly',
            });

            const startDate = calendar[0].date;
            const endDate = calendar[calendar.length - 1].date;
            
            expect(stringifyDate(startDate)).toBe('2020-01-01');
            expect(stringifyDate(endDate)).toBe('2020-01-31');
        });
    });
});
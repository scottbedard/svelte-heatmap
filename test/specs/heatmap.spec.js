const { expect } = require('chai');
const Heatmap = require('../../');
const sinon = require('sinon');

describe('heatmap', () => {
    const div = () => document.createElement('div');

    //
    // validation
    //
    describe('validation', () => {
        it('throws a warning if no history is provided', () => {
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div() });

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Missing required "history" prop');

            warn.restore();
        });

        it('throws a warning if the history is not an array', () => {
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history: false }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('History must be an array');

            warn.restore();
        });

        it('throws a warning if a history item is not an object', () => {
            const history = [false];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('All history items must be objects with "date" and "value" properties.');

            warn.restore();
        });

        it('throws a warning if a history item is missing a date', () => {
            const history = [{ value: 0 }];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid history date. Expected YYYY/MM/DD string, got undefined.');

            warn.restore();
        });

        it('throws a warning if a history item has a malformed date', () => {
            const history = [{ date: '1234-56-78', value: 0 }];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid history date. Expected YYYY/MM/DD string, got 1234-56-78.');

            warn.restore();
        });

        it('throws a warning if a history value is not a number', () => {
            const history = [{ date: '2017/01/01' }];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid history value. Expected positive number, got undefined.');

            warn.restore();
        });

        it('throws a warning if a history value is negative', () => {
            const history = [{ date: '2017/01/01', value: -1 }];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid history value. Expected positive number, got -1.');

            warn.restore();
        });

        it('throws a warning if a history value is infinite', () => {
            const history = [{ date: '2017/01/01', value: Infinity }];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid history value. Expected positive number, got Infinity.');

            warn.restore();
        });

        it('throws a warning if the tooltip is not a function', () => {
            const warn = sinon.stub(console, 'warn');

            new Heatmap({
                target: div(),
                data: {
                    history: [],
                    tooltip: null,
                },
            });

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid configuration, tooltip must be a function');

            warn.restore();
        });

        it('throws a warning if an invalid color number is provided', () => {
            const warn = sinon.stub(console, 'warn');
                        
            new Heatmap({
                target: div(),
                data: {
                    colors: -6,
                    highColor: '#000000',
                    history: [],
                    lowColor: '#ffffff',
                },
            });

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid color value. Expected a whole number greater than 2, got -6');

            warn.restore();
        });

        it('throws a warning if colors is a number, but lowColor is not a valid string', () => {
            const warn = sinon.stub(console, 'warn');
            
            new Heatmap({
                target: div(),
                data: {
                    colors: 5,
                    highColor: '#f00000',
                    history: [],
                    lowColor: 'blahhhhhhh',
                },
            });

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid lowColor. Expected 6 digit hex color, got blahhhhhhh');

            warn.restore();
        });

        it('throws a warning if colors is a number, but highColor is not a valid string', () => {
            const warn = sinon.stub(console, 'warn');
            
            new Heatmap({
                target: div(),
                data: {
                    colors: 5,
                    highColor: 4,
                    history: [],
                    lowColor: '#aabbcc',
                },
            });

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid highColor. Expected 6 digit hex color, got 4');

            warn.restore();
        });
    });

    //
    // output
    //
    describe('output', () => {
        it('renders a container for each week with child day containers', () => {
            const el = div();

            new Heatmap({
                target: el,
                data: {
                    history: [
                        { date: '2017/11/01', value: 0 },
                        { date: '2017/11/08', value: 0 },
                    ],
                },
            });

            const weeks = el.querySelectorAll('.svelte-heatmap-week');
            expect(weeks.length).to.equal(2);

            // the first day of this week is a wednesday, so we should see
            // three filler days, and 4 days with values inside of them.
            expect(weeks[0].querySelectorAll('.svelte-heatmap-day').length).to.equal(7);
            expect(weeks[0].querySelectorAll('.svelte-heatmap-day-inner').length).to.equal(4);

            // and the second week should have the other 4 days with values
            expect(weeks[1].querySelectorAll('.svelte-heatmap-day').length).to.equal(4);
            expect(weeks[1].querySelectorAll('.svelte-heatmap-day-inner').length).to.equal(4);
        });

        it('fills gaps between missing days', () => {
            const el = div();

            new Heatmap({
                target: el,
                data: {
                    history: [
                        { date: '2017/11/05', value: 0 },
                        { date: '2017/11/07', value: 0 },
                    ],
                },
            });

            // there should be 3 days, even though we only provided 2 data points
            expect(el.querySelectorAll('.svelte-heatmap-day').length).to.equal(3);
        });

        it('renders a default tooltip when none is provided', () => {
            const el = div();

            new Heatmap({
                target: el,
                data: {
                    history: [{ date: '2017/11/05', value: 123 }],
                },
            });

            expect(el.querySelectorAll('.svelte-heatmap-day-tooltip').length).to.equal(1);
            expect(el.querySelector('.svelte-heatmap-day-tooltip').textContent).to.equal('123 on 2017/11/05');
        });

        it('supports a function to customize the tooltip content', () => {
            const el = div();

            new Heatmap({
                target: el,
                data: {
                    history: [{ date: '2017/11/05', value: 123 }],
                    tooltip: (date, value) => `date: <b>${date}</b> / value: <b>${value}</b>`
                },
            });

            expect(el.querySelector('.svelte-heatmap-day-tooltip').innerHTML).to.include('date: <b>2017/11/05</b> / value: <b>123</b>');
        });

        it('renders the correct color for each day', () => {
            const el = div();

            new Heatmap({
                target: el,
                data: {
                    history: [
                        { date: '2017/11/05', value: 0 },
                        // omitting 2017/11/06
                        { date: '2017/11/07', value: 1 },
                        { date: '2017/11/08', value: 2 },
                        { date: '2017/11/09', value: 3 },
                        { date: '2017/11/10', value: 4 },
                    ],
                },
            });

            const squares = el.querySelectorAll('.svelte-heatmap-day-inner');
            expect(squares[0].style.backgroundColor).to.equal('rgb(235, 237, 240)'); // 2017/11/05
            expect(squares[1].style.backgroundColor).to.equal('rgb(235, 237, 240)'); // 2017/11/06
            expect(squares[2].style.backgroundColor).to.equal('rgb(198, 228, 139)'); // 2017/11/07
            expect(squares[3].style.backgroundColor).to.equal('rgb(123, 201, 111)'); // 2017/11/08
            expect(squares[4].style.backgroundColor).to.equal('rgb(35, 154, 59)'); // 2017/11/09
            expect(squares[5].style.backgroundColor).to.equal('rgb(25, 97, 39)'); // 2017/11/10
        });

        it('accepts a custom empty color', () => {
            const el = div();
            
            new Heatmap({
                target: el,
                data: {
                    emptyColor: 'red',
                    history: [
                        { date: '2017/11/05', value: 0 },
                    ],
                },
            });

            expect(el.querySelector('.svelte-heatmap-day-inner').style.backgroundColor).to.equal('red');
        });

        it('accepts an array of colors', () => {
            const el = div();
            
            new Heatmap({
                target: el,
                data: {
                    colors: ['red', 'green', 'blue'],
                    history: [
                        { date: '2017/11/05', value: 1 },
                        { date: '2017/11/06', value: 2 },
                        { date: '2017/11/07', value: 3 },
                    ],
                },
            });

            expect(el.querySelector('.svelte-heatmap-day:nth-child(1) .svelte-heatmap-day-inner').style.backgroundColor)
                .to.equal('red');

            expect(el.querySelector('.svelte-heatmap-day:nth-child(2) .svelte-heatmap-day-inner').style.backgroundColor)
                .to.equal('green');

            expect(el.querySelector('.svelte-heatmap-day:nth-child(3) .svelte-heatmap-day-inner').style.backgroundColor)
                .to.equal('blue'); 
        });

        it('accepts a low and high color', () => {
            const el = div();
            
            new Heatmap({
                target: el,
                data: {
                    colors: 3,
                    lowColor: '#000000',
                    highColor: '#ffffff',
                    history: [
                        { date: '2017/11/05', value: 1 },
                        { date: '2017/11/06', value: 2 },
                        { date: '2017/11/07', value: 3 },
                    ],
                },
            });

            expect(el.querySelector('.svelte-heatmap-day:nth-child(1) .svelte-heatmap-day-inner').style.backgroundColor)
                .to.equal('rgb(0, 0, 0)');

            expect(el.querySelector('.svelte-heatmap-day:nth-child(2) .svelte-heatmap-day-inner').style.backgroundColor)
                .to.equal('rgb(128, 128, 128)');

            expect(el.querySelector('.svelte-heatmap-day:nth-child(3) .svelte-heatmap-day-inner').style.backgroundColor)
                .to.equal('rgb(255, 255, 255)'); 
        });

        it('renders a legend', () => {
            const el = div();
            
            const vm = new Heatmap({
                target: el,
                data: {
                    colors: ['red', 'green', 'blue'],
                    emptyColor: 'gray',
                    history: [
                        { date: '2017/11/05', value: 1 },
                    ],
                    legendHigh: 'high',
                    legendLow: 'low',
                    showLegend: false,
                },
            });

            // there should be no legend if showLegend is false
            expect(el.querySelector('.svelte-heatmap-legend')).to.be.null;

            // enable the legend
            vm.set({ showLegend: true });

            // make sure the container and text values are correct
            expect(el.querySelector('.svelte-heatmap-legend')).not.to.be.null;
            expect(el.querySelector('.svelte-heatmap-legend-low').textContent).to.equal('low');
            expect(el.querySelector('.svelte-heatmap-legend-high').textContent).to.equal('high');
           
            // make sure each of our colors is displayed correctly
            const legendColors = el.querySelectorAll('.svelte-heatmap-legend-color');
            expect(legendColors.length).to.equal(4);
            expect(legendColors[0].style.backgroundColor).to.equal('gray');
            expect(legendColors[1].style.backgroundColor).to.equal('red');
            expect(legendColors[2].style.backgroundColor).to.equal('green');
            expect(legendColors[3].style.backgroundColor).to.equal('blue');
        });
    });
});

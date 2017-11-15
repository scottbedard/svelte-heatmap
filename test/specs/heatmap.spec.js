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
            expect(warn.lastCall.args[0]).to.include('Invalid history date. Expected YYYY-MM-DD string, got undefined.');

            warn.restore();
        });

        it('throws a warning if a history item has a malformed date', () => {
            const history = [{ date: 'foo' }];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid history date. Expected YYYY-MM-DD string, got foo.');

            warn.restore();
        });
        //Invalid history value. Expected positive number, got

        it('throws a warning if a history value is not a number', () => {
            const history = [{ date: '2017-01-01' }];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid history value. Expected positive number, got undefined.');

            warn.restore();
        });

        it('throws a warning if a history value is negative', () => {
            const history = [{ date: '2017-01-01', value: -1 }];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid history value. Expected positive number, got -1.');

            warn.restore();
        });

        it('throws a warning if a history value is infinite', () => {
            const history = [{ date: '2017-01-01', value: Infinity }];
            const warn = sinon.stub(console, 'warn');

            new Heatmap({ target: div(), data: { history }});

            expect(warn.called).to.be.true;
            expect(warn.lastCall.args[0]).to.include('Invalid history value. Expected positive number, got Infinity.');

            warn.restore();
        });
    });
});
